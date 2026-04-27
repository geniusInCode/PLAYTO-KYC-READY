from django.contrib import admin
from .models import NotificationEvent


@admin.register(NotificationEvent)
class NotificationEventAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'event_type', 'timestamp', 'sent']
    list_filter = ['event_type', 'sent']
    readonly_fields = ['merchant', 'event_type', 'timestamp', 'payload']
