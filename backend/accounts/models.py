import uuid
from django.utils import timezone
from datetime import timedelta


from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    MERCHANT = 'merchant'
    REVIEWER = 'reviewer'
    ROLE_CHOICES = [
        (MERCHANT, 'Merchant'),
        (REVIEWER, 'Reviewer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=MERCHANT)
    phone = models.CharField(max_length=20, blank=True)

    def is_merchant(self):
        return self.role == self.MERCHANT

    def is_reviewer(self):
        return self.role == self.REVIEWER

    def __str__(self):
        return f"{self.username} ({self.role})"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def is_valid(self):
        if self.used:
            return False
        expiry = self.created_at + timedelta(hours=1)
        return timezone.now() < expiry