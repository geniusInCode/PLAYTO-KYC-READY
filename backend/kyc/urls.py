from django.urls import path
from .views import (
    MyKYCView, SubmitKYCView, DocumentUploadView,
    ReviewerQueueView, ReviewerSubmissionDetailView, ReviewerTransitionView,
)

urlpatterns = [
    # Merchant endpoints
    path('kyc/my/', MyKYCView.as_view(), name='my-kyc'),
    path('kyc/my/submit/', SubmitKYCView.as_view(), name='submit-kyc'),
    path('kyc/my/documents/', DocumentUploadView.as_view(), name='upload-document'),

    # Reviewer endpoints
    path('reviewer/queue/', ReviewerQueueView.as_view(), name='reviewer-queue'),
    path('reviewer/submissions/<int:pk>/', ReviewerSubmissionDetailView.as_view(), name='reviewer-detail'),
    path('reviewer/submissions/<int:pk>/transition/', ReviewerTransitionView.as_view(), name='reviewer-transition'),
]
