from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import io

from accounts.models import User
from kyc.models import KYCSubmission, KYCDocument
from kyc.state_machine import transition, InvalidTransitionError, VALID_TRANSITIONS


class StateMachineUnitTest(TestCase):
    """Unit tests for the state machine logic itself."""

    def setUp(self):
        self.merchant = User.objects.create_user(
            username='merchant_unit', password='pass', role='merchant'
        )
        self.reviewer = User.objects.create_user(
            username='reviewer_unit', password='pass', role='reviewer'
        )

    def test_valid_draft_to_submitted(self):
        sub = KYCSubmission.objects.create(merchant=self.merchant, status='draft')
        result = transition(sub, 'submitted', self.merchant)
        self.assertEqual(result.status, 'submitted')
        self.assertIsNotNone(result.submitted_at)

    def test_illegal_approved_to_draft_raises(self):
        sub = KYCSubmission.objects.create(merchant=self.merchant, status='approved')
        with self.assertRaises(InvalidTransitionError) as ctx:
            transition(sub, 'draft', self.reviewer)
        self.assertIn('terminal state', str(ctx.exception))

    def test_illegal_draft_to_approved_raises(self):
        sub = KYCSubmission.objects.create(merchant=self.merchant, status='draft')
        with self.assertRaises(InvalidTransitionError):
            transition(sub, 'approved', self.reviewer)

    def test_all_terminal_states_reject_all_transitions(self):
        for terminal in ['approved', 'rejected']:
            sub = KYCSubmission.objects.create(
                merchant=User.objects.create_user(
                    username=f'mer_{terminal}', password='pass', role='merchant'
                ),
                status=terminal
            )
            all_states = list(VALID_TRANSITIONS.keys())
            for s in all_states:
                with self.assertRaises(InvalidTransitionError):
                    transition(sub, s, self.reviewer)

    def test_notification_event_logged_on_transition(self):
        from notifications.models import NotificationEvent
        sub = KYCSubmission.objects.create(merchant=self.merchant, status='draft')
        transition(sub, 'submitted', self.merchant)
        event = NotificationEvent.objects.filter(
            merchant=self.merchant,
            event_type='kyc_status_submitted'
        ).first()
        self.assertIsNotNone(event)
        self.assertEqual(event.payload['from_state'], 'draft')
        self.assertEqual(event.payload['to_state'], 'submitted')


class IllegalTransitionAPITest(TestCase):
    """
    The one required test: illegal state transition returns 400.
    """

    def setUp(self):
        self.client = APIClient()
        self.reviewer = User.objects.create_user(
            username='reviewer1', password='Test@1234', role='reviewer'
        )
        self.merchant = User.objects.create_user(
            username='merchant1', password='Test@1234', role='merchant'
        )
        self.submission = KYCSubmission.objects.create(
            merchant=self.merchant,
            status='approved'
        )

    def _auth_reviewer(self):
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'reviewer1', 'password': 'Test@1234'
        })
        token = response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_approved_to_draft_returns_400(self):
        """Core test: illegal transition must return 400 with INVALID_TRANSITION code."""
        self._auth_reviewer()
        response = self.client.post(
            f'/api/v1/reviewer/submissions/{self.submission.id}/transition/',
            {'new_state': 'draft'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'INVALID_TRANSITION')

    def test_approved_to_submitted_returns_400(self):
        self._auth_reviewer()
        response = self.client.post(
            f'/api/v1/reviewer/submissions/{self.submission.id}/transition/',
            {'new_state': 'submitted'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_transition_returns_200(self):
        """Positive test: valid transition should succeed."""
        sub = KYCSubmission.objects.create(
            merchant=User.objects.create_user(
                username='merchant2', password='pass', role='merchant'
            ),
            status='submitted',
            submitted_at=timezone.now()
        )
        self._auth_reviewer()
        response = self.client.post(
            f'/api/v1/reviewer/submissions/{sub.id}/transition/',
            {'new_state': 'under_review'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'under_review')


class MerchantAuthIsolationTest(TestCase):
    """Merchant A cannot access Merchant B's submission."""

    def setUp(self):
        self.client = APIClient()
        self.merchant_a = User.objects.create_user(
            username='merchant_a', password='pass', role='merchant'
        )
        self.merchant_b = User.objects.create_user(
            username='merchant_b', password='pass', role='merchant'
        )
        KYCSubmission.objects.create(merchant=self.merchant_b, status='draft')

    def test_merchant_only_sees_own_submission(self):
        """Merchant A logs in and should get their own (empty) submission, not B's."""
        self.client.force_authenticate(self.merchant_a)
        response = self.client.get('/api/v1/kyc/my/')
        self.assertEqual(response.status_code, 200)
        # merchant_a's submission is created fresh (get_or_create)
        self.assertEqual(response.data['merchant_username'], 'merchant_a')

    def test_merchant_cannot_access_reviewer_queue(self):
        self.client.force_authenticate(self.merchant_a)
        response = self.client.get('/api/v1/reviewer/queue/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class FileValidationTest(TestCase):
    """File upload validation."""

    def setUp(self):
        self.client = APIClient()
        self.merchant = User.objects.create_user(
            username='uploader', password='pass', role='merchant'
        )
        KYCSubmission.objects.create(merchant=self.merchant, status='draft')
        self.client.force_authenticate(self.merchant)

    def test_oversized_file_rejected(self):
        # Create a 6 MB fake file
        big_file = io.BytesIO(b'x' * (6 * 1024 * 1024))
        big_file.name = 'large.pdf'
        # Set PDF magic bytes
        big_file.seek(0)
        response = self.client.post(
            '/api/v1/kyc/my/documents/',
            {'doc_type': 'pan', 'file': big_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_file_type_rejected(self):
        # EXE-like file (MZ header)
        fake_exe = io.BytesIO(b'MZ\x90\x00' + b'\x00' * 100)
        fake_exe.name = 'malware.jpg'  # Renamed to jpg but still EXE
        response = self.client.post(
            '/api/v1/kyc/my/documents/',
            {'doc_type': 'pan', 'file': fake_exe},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
