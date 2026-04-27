"""
Seed script — creates test accounts for Playto KYC demo.

Accounts created (on first deploy only):
  merchant1 / Test@1234  → draft submission (incomplete)
  merchant2 / Test@1234  → under_review (submitted 30h ago → SLA at_risk)
  reviewer1 / Test@1234  → reviewer dashboard access

Run:
  python seed.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from kyc.models import KYCSubmission
from notifications.models import NotificationEvent


def run():
    print("🌱 Checking seed status...")

    # ── Idempotency guard: skip if demo accounts already exist ──
    if User.objects.filter(username='merchant1').exists():
        print("  ⏭️  Demo accounts already exist — skipping seed (idempotent).")
        return

    print("  ✨ Seeding demo accounts for the first time...")

    # ── Merchant 1: Draft (incomplete form) ──
    m1 = User.objects.create_user(
        username='merchant1',
        email='merchant1@demo.com',
        password='Test@1234',
        first_name='Rahul',
        last_name='Sharma',
        role='merchant',
    )
    KYCSubmission.objects.create(
        merchant=m1,
        status='draft',
        full_name='Rahul Sharma',
        email='rahul@example.com',
        phone='9876543210',
        # Business details not filled yet — still in draft
    )
    print(f"  ✅ merchant1 / Test@1234  → status: draft")

    # ── Merchant 2: Under Review + AT RISK (submitted 30 hours ago) ──
    m2 = User.objects.create_user(
        username='merchant2',
        email='merchant2@demo.com',
        password='Test@1234',
        first_name='Priya',
        last_name='Patel',
        role='merchant',
    )
    sub2 = KYCSubmission.objects.create(
        merchant=m2,
        status='under_review',
        full_name='Priya Patel',
        email='priya@pixelstudio.in',
        phone='9123456789',
        business_name='Pixel Studio',
        business_type='Design Agency',
        monthly_volume_usd=5000,
        submitted_at=timezone.now() - timedelta(hours=30),  # → triggers SLA at_risk
    )
    # Log a fake notification event for this submission
    NotificationEvent.objects.create(
        merchant=m2,
        event_type='kyc_status_under_review',
        payload={
            'from_state': 'submitted',
            'to_state': 'under_review',
            'actor_id': 0,
            'actor_username': 'system',
            'note': '',
            'submission_id': sub2.id,
        }
    )
    print(f"  ✅ merchant2 / Test@1234  → status: under_review (AT RISK — 30h in queue)")

    # ── Reviewer ──
    User.objects.create_user(
        username='reviewer1',
        email='reviewer1@playto.so',
        password='Test@1234',
        first_name='Arjun',
        last_name='Verma',
        role='reviewer',
    )
    print(f"  ✅ reviewer1 / Test@1234  → reviewer dashboard")

    print()
    print("🎉 Done! Test accounts:")
    print("   merchant1 / Test@1234  (draft)")
    print("   merchant2 / Test@1234  (under_review, SLA at risk)")
    print("   reviewer1 / Test@1234  (reviewer)")


if __name__ == '__main__':
    run()
