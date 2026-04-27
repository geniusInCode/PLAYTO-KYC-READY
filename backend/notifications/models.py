from django.db import models
from django.conf import settings


class NotificationEvent(models.Model):
    """
    Records every state-change event that would trigger a notification.
    We don't send emails — we log what SHOULD be sent.
    The email sender (Celery task, cron, etc.) would read this table.
    """
    merchant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_events'
    )
    event_type = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict)
    # sent=True would mean the email has been dispatched
    sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} for {self.merchant.username} at {self.timestamp}"
