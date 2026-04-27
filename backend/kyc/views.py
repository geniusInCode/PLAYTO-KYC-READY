from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Case, When, BooleanField, Avg, F, ExpressionWrapper, DurationField
from datetime import timedelta

from accounts.permissions import IsMerchant, IsReviewer
from .models import KYCSubmission, KYCDocument
from .serializers import (
    KYCSubmissionSerializer, KYCSubmissionUpdateSerializer,
    DocumentUploadSerializer, TransitionSerializer,
    QueueSubmissionSerializer,
)
from .state_machine import transition, InvalidTransitionError


# ─────────────────────────────────────────
# MERCHANT VIEWS
# ─────────────────────────────────────────

class MyKYCView(APIView):
    """GET or PATCH the merchant's own KYC submission."""
    permission_classes = [IsMerchant]

    def _get_or_create_submission(self, user):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=user)
        return submission

    def get(self, request):
        submission = self._get_or_create_submission(request.user)
        serializer = KYCSubmissionSerializer(submission, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        """Save progress. Only works when status is draft or more_info_requested."""
        submission = self._get_or_create_submission(request.user)

        if submission.status not in ('draft', 'more_info_requested'):
            return Response({
                'error': {
                    'code': 'EDIT_NOT_ALLOWED',
                    'message': f"Cannot edit a submission in '{submission.status}' state.",
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = KYCSubmissionUpdateSerializer(
            submission, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(KYCSubmissionSerializer(submission, context={'request': request}).data)
        return Response({
            'error': {'code': 'VALIDATION_ERROR', 'message': serializer.errors}
        }, status=status.HTTP_400_BAD_REQUEST)


class SubmitKYCView(APIView):
    """Merchant submits KYC: draft → submitted."""
    permission_classes = [IsMerchant]

    def post(self, request):
        submission = get_object_or_404(KYCSubmission, merchant=request.user)

        # Basic completeness check before allowing submit
        required_fields = ['full_name', 'email', 'phone', 'business_name', 'business_type']
        missing = [f for f in required_fields if not getattr(submission, f)]
        if missing:
            return Response({
                'error': {
                    'code': 'INCOMPLETE_SUBMISSION',
                    'message': f"Please fill in: {', '.join(missing)} before submitting.",
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            submission = transition(submission, 'submitted', request.user)
        except InvalidTransitionError as e:
            return Response({
                'error': {'code': 'INVALID_TRANSITION', 'message': str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response(KYCSubmissionSerializer(submission, context={'request': request}).data)


class DocumentUploadView(APIView):
    """Upload a KYC document (PAN, Aadhaar, bank statement)."""
    permission_classes = [IsMerchant]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        submission = get_object_or_404(KYCSubmission, merchant=request.user)

        if submission.status not in ('draft', 'more_info_requested'):
            return Response({
                'error': {
                    'code': 'UPLOAD_NOT_ALLOWED',
                    'message': f"Cannot upload documents in '{submission.status}' state.",
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': {'code': 'VALIDATION_ERROR', 'message': serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        doc_type = serializer.validated_data['doc_type']

        # Delete existing document of same type (replace)
        KYCDocument.objects.filter(submission=submission, doc_type=doc_type).delete()

        doc = KYCDocument.objects.create(
            submission=submission,
            doc_type=doc_type,
            file=file,
            original_filename=file.name,
            file_size=file.size,
        )

        from .serializers import KYCDocumentSerializer
        return Response(
            KYCDocumentSerializer(doc, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def get(self, request):
        submission = get_object_or_404(KYCSubmission, merchant=request.user)
        from .serializers import KYCDocumentSerializer
        docs = submission.documents.all()
        return Response(KYCDocumentSerializer(docs, many=True, context={'request': request}).data)


# ─────────────────────────────────────────
# REVIEWER VIEWS
# ─────────────────────────────────────────

class ReviewerQueueView(APIView):
    """
    GET: Returns queue (oldest first) + dashboard metrics.

    is_at_risk is computed DYNAMICALLY via annotation.
    We do NOT store it as a field (that would go stale).
    """
    permission_classes = [IsReviewer]

    def get(self, request):
        now = timezone.now()
        sla_threshold = now - timedelta(hours=24)
        last_7_days = now - timedelta(days=7)

        # Active queue: submitted, under_review, more_info_requested
        queue = KYCSubmission.objects.filter(
            status__in=['submitted', 'under_review', 'more_info_requested']
        ).annotate(
            # Dynamically flag if submission has been waiting > 24h
            # Never stored — always recomputed from submitted_at
            is_at_risk=Case(
                When(submitted_at__lt=sla_threshold, then=True),
                default=False,
                output_field=BooleanField(),
            )
        ).order_by('submitted_at')  # oldest first — FIFO queue

        # Metrics
        in_queue = queue.count()

        # Approval rate over last 7 days
        reviewed_7d = KYCSubmission.objects.filter(
            updated_at__gte=last_7_days,
            status__in=['approved', 'rejected']
        )
        total_reviewed = reviewed_7d.count()
        approved_count = reviewed_7d.filter(status='approved').count()
        approval_rate = round(approved_count / total_reviewed * 100, 1) if total_reviewed else 0

        # Average time in queue (for submissions currently in queue)
        avg_hours = 0
        if in_queue > 0:
            durations = [
                (now - s.submitted_at).total_seconds() / 3600
                for s in queue
                if s.submitted_at
            ]
            avg_hours = round(sum(durations) / len(durations), 1) if durations else 0

        return Response({
            'metrics': {
                'in_queue': in_queue,
                'avg_time_in_queue_hours': avg_hours,
                'approval_rate_7d': approval_rate,
                'at_risk_count': queue.filter(is_at_risk=True).count(),
            },
            'submissions': QueueSubmissionSerializer(
                queue, many=True, context={'request': request}
            ).data
        })


class ReviewerSubmissionDetailView(APIView):
    """GET full details of one submission."""
    permission_classes = [IsReviewer]

    def get(self, request, pk):
        # Reviewer can see ANY submission — no merchant filter
        submission = get_object_or_404(KYCSubmission, pk=pk)
        serializer = KYCSubmissionSerializer(submission, context={'request': request})
        return Response(serializer.data)


class ReviewerTransitionView(APIView):
    """POST to change state of a submission."""
    permission_classes = [IsReviewer]

    def post(self, request, pk):
        submission = get_object_or_404(KYCSubmission, pk=pk)
        serializer = TransitionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'error': {'code': 'VALIDATION_ERROR', 'message': serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)

        new_state = serializer.validated_data['new_state']
        note = serializer.validated_data.get('note', '')

        try:
            submission = transition(submission, new_state, request.user, note=note)
        except InvalidTransitionError as e:
            return Response({
                'error': {'code': 'INVALID_TRANSITION', 'message': str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response(KYCSubmissionSerializer(submission, context={'request': request}).data)
