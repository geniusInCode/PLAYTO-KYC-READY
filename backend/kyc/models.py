from django.db import models
from django.conf import settings


class KYCSubmission(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    ]

    merchant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kyc_submission'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')

    # Step 1 — Personal Details
    full_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Step 2 — Business Details
    business_name = models.CharField(max_length=200, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    monthly_volume_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    # Review
    reviewer_note = models.TextField(blank=True)

    # Timestamps
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['submitted_at', 'created_at']

    def __str__(self):
        return f"KYC({self.merchant.username}) - {self.status}"


class KYCDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ('pan', 'PAN Card'),
        ('aadhaar', 'Aadhaar Card'),
        ('bank_statement', 'Bank Statement'),
        ('selfie', 'Face Selfie'),
    ]

    submission = models.ForeignKey(
        KYCSubmission,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    doc_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to='kyc_docs/%Y/%m/')
    original_filename = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Each doc type once per submission
        unique_together = [('submission', 'doc_type')]

    def __str__(self):
        return f"{self.doc_type} for {self.submission.merchant.username}"
