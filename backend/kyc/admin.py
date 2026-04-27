from django.contrib import admin
from .models import KYCSubmission, KYCDocument


class KYCDocumentInline(admin.TabularInline):
    model = KYCDocument
    extra = 0
    readonly_fields = ['uploaded_at']


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'status', 'full_name', 'business_name', 'submitted_at']
    list_filter = ['status']
    search_fields = ['merchant__username', 'full_name', 'business_name']
    inlines = [KYCDocumentInline]
    readonly_fields = ['created_at', 'updated_at', 'submitted_at']
