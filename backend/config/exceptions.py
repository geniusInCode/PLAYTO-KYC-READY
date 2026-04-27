from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    from kyc.state_machine import InvalidTransitionError

    if isinstance(exc, InvalidTransitionError):
        return Response({
            'error': {
                'code': 'INVALID_TRANSITION',
                'message': str(exc),
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    response = exception_handler(exc, context)

    if response is not None:
        original_data = response.data
        if isinstance(original_data, dict) and 'detail' in original_data:
            message = str(original_data['detail'])
        elif isinstance(original_data, list):
            message = str(original_data[0])
        else:
            message = str(original_data)

        response.data = {
            'error': {
                'code': 'ERROR',
                'message': message,
                'detail': original_data,
            }
        }

    return response
