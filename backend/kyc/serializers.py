from rest_framework import serializers
from .models import KYCSubmission, KYCDocument
from .validators import validate_document_file


class KYCDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = KYCDocument
        fields = ['id', 'doc_type', 'file_url', 'original_filename', 'file_size', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class KYCSubmissionSerializer(serializers.ModelSerializer):
    documents = KYCDocumentSerializer(many=True, read_only=True)
    merchant_username = serializers.CharField(source='merchant.username', read_only=True)
    is_at_risk = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = KYCSubmission
        fields = [
            'id', 'merchant_username', 'status',
            'full_name', 'email', 'phone',
            'business_name', 'business_type', 'monthly_volume_usd',
            'reviewer_note', 'submitted_at', 'created_at', 'updated_at',
            'documents', 'is_at_risk',
        ]
        read_only_fields = ['status', 'submitted_at', 'created_at', 'updated_at', 'reviewer_note']


class KYCSubmissionUpdateSerializer(serializers.ModelSerializer):
    """For merchant to update draft fields."""
    class Meta:
        model = KYCSubmission
        fields = [
            'full_name', 'email', 'phone',
            'business_name', 'business_type', 'monthly_volume_usd',
        ]


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()

    class Meta:
        model = KYCDocument
        fields = ['id', 'doc_type', 'file']

    def validate_file(self, value):
        validate_document_file(value)
        return value


class TransitionSerializer(serializers.Serializer):
    new_state = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_new_state(self, value):
        from .state_machine import VALID_TRANSITIONS
        all_states = list(VALID_TRANSITIONS.keys())
        if value not in all_states:
            raise serializers.ValidationError(
                f"'{value}' is not a valid state. Choose from: {all_states}"
            )
        return value


class QueueSubmissionSerializer(serializers.ModelSerializer):
    """Lightweight serializer for queue list view."""
    documents = KYCDocumentSerializer(many=True, read_only=True)
    merchant_username = serializers.CharField(source='merchant.username', read_only=True)
    merchant_email = serializers.CharField(source='merchant.email', read_only=True)
    is_at_risk = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = KYCSubmission
        fields = [
            'id', 'merchant_username', 'merchant_email', 'status',
            'full_name', 'business_name', 'monthly_volume_usd',
            'submitted_at', 'updated_at', 'reviewer_note',
            'is_at_risk', 'documents',
        ]
