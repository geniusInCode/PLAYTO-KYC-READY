"""
File upload validators.

We use python-magic to check actual file bytes (magic bytes),
NOT the file extension or Content-Type header — both are client-supplied
and trivially spoofable.

A malicious user can rename a .exe to .jpg or set Content-Type: image/jpeg.
Magic bytes cannot be faked without corrupting the file.
"""
import imghdr
import struct
from rest_framework.exceptions import ValidationError


ALLOWED_MIME_TYPES = {
    'pdf': b'%PDF',
    'jpeg': b'\xff\xd8\xff',
    'png': b'\x89PNG\r\n\x1a\n',
}

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB exactly


def validate_document_file(file):
    """
    Validate uploaded file:
    1. Size check first (cheap, no disk I/O needed)
    2. Magic bytes check for actual MIME type
    """
    # --- Step 1: Size check ---
    if file.size > MAX_FILE_SIZE_BYTES:
        size_mb = round(file.size / (1024 * 1024), 2)
        raise ValidationError(
            f"File too large: {size_mb} MB. Maximum allowed size is 5 MB."
        )

    # --- Step 2: Magic bytes check (NOT extension, NOT Content-Type) ---
    header = file.read(8)
    file.seek(0)  # CRITICAL: reset pointer after reading

    detected_type = None
    for mime_type, magic_bytes in ALLOWED_MIME_TYPES.items():
        if header[:len(magic_bytes)] == magic_bytes:
            detected_type = mime_type
            break

    if detected_type is None:
        raise ValidationError(
            "Invalid file type. Only PDF, JPG, and PNG files are accepted. "
            "File type is detected from content, not filename."
        )

    return detected_type
