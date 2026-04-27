# EXPLAINER.md — Playto KYC Pipeline

---

## 1. The State Machine

**Where does it live?**

`backend/kyc/state_machine.py` — one file, one function, single source of truth. No view ever sets `submission.status` directly. Everything goes through `transition()`.

```python
VALID_TRANSITIONS = {
    'draft':                ['submitted'],
    'submitted':            ['under_review'],
    'under_review':         ['approved', 'rejected', 'more_info_requested'],
    'more_info_requested':  ['submitted'],
    'approved':             [],
    'rejected':             [],
}

def transition(submission, new_state, actor, note=''):
    current = submission.status
    allowed = VALID_TRANSITIONS.get(current, [])

    if new_state not in allowed:
        if not allowed:
            raise InvalidTransitionError(
                f"'{current}' is a terminal state. No further transitions are possible."
            )
        raise InvalidTransitionError(
            f"Cannot transition from '{current}' to '{new_state}'. "
            f"Allowed next states: {allowed}"
        )
    # ... save + log notification
```

**How do I prevent illegal transitions?**

The dict defines every legal move. If the requested `new_state` is not in `allowed`, we raise `InvalidTransitionError`. The custom exception handler in `config/exceptions.py` catches this and returns a `400` with `code: INVALID_TRANSITION`. Terminal states (`approved`, `rejected`) have empty lists — so every transition out of them is illegal automatically.

---

## 2. The File Upload

**How is validation done?**

`backend/kyc/validators.py` — two checks in order:

```python
ALLOWED_MIME_TYPES = {
    'pdf':  b'%PDF',
    'jpeg': b'\xff\xd8\xff',
    'png':  b'\x89PNG\r\n\x1a\n',
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

def validate_document_file(file):
    # Step 1: size check — cheap, no I/O needed
    if file.size > MAX_FILE_SIZE_BYTES:
        raise ValidationError(f"File too large: {round(file.size/1024/1024, 2)} MB. Max is 5 MB.")

    # Step 2: magic bytes — read first 8 bytes of actual content
    header = file.read(8)
    file.seek(0)  # reset pointer — critical or the upload will be empty

    detected_type = None
    for mime_type, magic_bytes in ALLOWED_MIME_TYPES.items():
        if header[:len(magic_bytes)] == magic_bytes:
            detected_type = mime_type
            break

    if detected_type is None:
        raise ValidationError(
            "Invalid file type. Only PDF, JPG, PNG accepted. "
            "File type is detected from content, not filename."
        )
```

**What happens with a 50 MB file?**

Step 1 catches it immediately — `file.size > 5_242_880` → `ValidationError` → DRF returns `400`. The magic bytes check is never reached. The file is never written to disk.

We deliberately do NOT trust `Content-Type` or the file extension. A user can rename `malware.exe` to `document.jpg`. The magic bytes are the actual first bytes of the file content — you cannot fake them without corrupting the file.

---

## 3. The Reviewer Queue

**The query:**

```python
sla_threshold = timezone.now() - timedelta(hours=24)

queue = KYCSubmission.objects.filter(
    status__in=['submitted', 'under_review', 'more_info_requested']
).annotate(
    is_at_risk=Case(
        When(submitted_at__lt=sla_threshold, then=True),
        default=False,
        output_field=BooleanField(),
    )
).order_by('submitted_at')  # oldest first — FIFO
```

**Why this way?**

`is_at_risk` is computed dynamically via a database annotation — it is never stored as a field. If I stored it, it would go stale the moment the threshold passed. By annotating at query time, it is always accurate regardless of when the query runs.

`order_by('submitted_at')` gives oldest-first ordering — first-in, first-out queue. Reviewers handle the most urgent submissions automatically without manual sorting.

The metrics (approval rate, average time in queue, at_risk count) are also computed fresh on every request from the same queryset — no caching, no staleness.

---

## 4. The Auth

**How does merchant A get blocked from merchant B's submission?**

Two layers:

**Layer 1 — Permission class** (`accounts/permissions.py`):
```python
class IsMerchant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'merchant'
        )
```
This blocks unauthenticated requests and any non-merchant (e.g. a reviewer trying to use a merchant endpoint).

**Layer 2 — Query scoped to `request.user`** (`kyc/views.py`):
```python
class MyKYCView(APIView):
    permission_classes = [IsMerchant]

    def _get_or_create_submission(self, user):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=user)
        return submission
```

The query is `merchant=request.user` — it is structurally impossible to retrieve another merchant's submission through this endpoint. There is no `pk` in the URL for merchants — they only ever touch `/kyc/my/`. Even if they guessed another submission's ID, the endpoint has no parameter for it.

Reviewers use a separate endpoint (`/reviewer/submissions/<pk>/`) protected by `IsReviewer`. A merchant token returns `403` there.

---

## 5. The AI Audit

**What AI gave me (buggy):**

When I asked an AI to write the file upload validator, it gave me this:

```python
import magic

def validate_document_file(file):
    mime = magic.from_buffer(file.read(1024), mime=True)
    if mime not in ['application/pdf', 'image/jpeg', 'image/png']:
        raise ValidationError("Invalid file type.")
    if file.size > 5 * 1024 * 1024:
        raise ValidationError("File too large.")
```

**Three bugs I caught:**

1. **`python-magic` requires `libmagic` to be installed on the OS.** On Render's free tier, this system dependency is not available. The service would crash at runtime with `ImportError`. I replaced it with pure-Python magic byte checking — no system dependencies.

2. **File pointer never reset.** After `file.read(1024)`, the pointer is at position 1024. The actual upload would be saved missing the first 1024 bytes — a silent data corruption bug. I always call `file.seek(0)` after reading the header.

3. **Size check order is wrong.** Checking MIME before size means we read bytes from a potentially 500 MB file before rejecting it. I reversed the order: size check first (free — uses `file.size` metadata), then magic bytes (reads only 8 bytes). More efficient and safer.

**What I replaced it with:** The implementation in `backend/kyc/validators.py` above — no external dependencies, size-first, seek-safe.
