from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, PasswordResetToken
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': {'code': 'VALIDATION_ERROR', 'message': serializer.errors}
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            return Response({
                'error': {'code': 'INVALID_CREDENTIALS', 'message': 'Invalid username or password.'}
            }, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': {'code': 'MISSING_FIELD', 'message': 'Email is required.'}}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If this email is registered, a reset link has been sent.', 'debug_token': None})

        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        reset_token = PasswordResetToken.objects.create(user=user)

        return Response({
            'message': 'If this email is registered, a reset link has been sent.',
            'debug_token': str(reset_token.token),
            'note': 'In production this token would be sent via email only.'
        })


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '').strip()

        if not token_str or not new_password:
            return Response({'error': {'code': 'MISSING_FIELDS', 'message': 'token and new_password are required.'}}, status=400)

        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'error': {'code': 'INVALID_TOKEN', 'message': 'Token is invalid or does not exist.'}}, status=400)

        if not reset_token.is_valid():
            return Response({'error': {'code': 'TOKEN_EXPIRED_OR_USED', 'message': 'This reset token has already been used or has expired (1 hour limit).'}}, status=400)

        try:
            validate_password(new_password, reset_token.user)
        except DjangoValidationError as e:
            return Response({'error': {'code': 'WEAK_PASSWORD', 'message': list(e.messages)}}, status=400)

        reset_token.user.set_password(new_password)
        reset_token.user.save()
        reset_token.used = True
        reset_token.save()

        return Response({'message': 'Password has been reset successfully. You can now log in.'})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not old_password or not new_password:
            return Response({'error': {'code': 'MISSING_FIELDS', 'message': 'old_password and new_password are required.'}}, status=400)

        if not request.user.check_password(old_password):
            return Response({'error': {'code': 'WRONG_PASSWORD', 'message': 'Current password is incorrect.'}}, status=400)

        if old_password == new_password:
            return Response({'error': {'code': 'SAME_PASSWORD', 'message': 'New password must be different from current password.'}}, status=400)

        try:
            validate_password(new_password, request.user)
        except DjangoValidationError as e:
            return Response({'error': {'code': 'WEAK_PASSWORD', 'message': list(e.messages)}}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        PasswordResetToken.objects.filter(user=request.user, used=False).update(used=True)

        return Response({'message': 'Password changed successfully. Please log in again with your new password.'})