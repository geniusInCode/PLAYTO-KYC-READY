from rest_framework.permissions import BasePermission


class IsMerchant(BasePermission):
    """Only authenticated merchants can access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'merchant'
        )


class IsReviewer(BasePermission):
    """Only authenticated reviewers can access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'reviewer'
        )
