"""
State Machine for KYC Submissions.

This is the SINGLE SOURCE OF TRUTH for all state transitions.
No view should ever set submission.status directly.
Always call transition() from here.

Legal transitions:
  draft → submitted
  submitted → under_review
  under_review → approved | rejected | more_info_requested
  more_info_requested → submitted

Terminal states (no exits): approved, rejected
"""
from django.utils import timezone


# All valid transitions defined in ONE place
VALID_TRANSITIONS = {
    'draft':                ['submitted'],
    'submitted':            ['under_review'],
    'under_review':         ['approved', 'rejected', 'more_info_requested'],
    'more_info_requested':  ['submitted'],
    # Terminal states — no outgoing transitions
    'approved':             [],
    'rejected':             [],
}


class InvalidTransitionError(Exception):
    """Raised when an illegal state transition is attempted."""
    pass


def transition(submission, new_state, actor, note=''):
    """
    Attempt to move a submission to new_state.

    Raises InvalidTransitionError if the transition is not allowed.
    On success: updates status, saves, logs a NotificationEvent.
    """
    # Import here to avoid circular imports
    from notifications.models import NotificationEvent

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

    old_state = current
    submission.status = new_state

    # Track when submission first enters queue
    if new_state == 'submitted' and not submission.submitted_at:
        submission.submitted_at = timezone.now()

    # Re-submitted after more_info: reset submitted_at to now for SLA tracking
    if new_state == 'submitted' and old_state == 'more_info_requested':
        submission.submitted_at = timezone.now()

    if note:
        submission.reviewer_note = note

    submission.save(update_fields=['status', 'submitted_at', 'reviewer_note', 'updated_at'])

    # Log notification event — always, regardless of whether emails are sent
    NotificationEvent.objects.create(
        merchant=submission.merchant,
        event_type=f'kyc_status_{new_state}',
        payload={
            'from_state': old_state,
            'to_state': new_state,
            'actor_id': actor.id,
            'actor_username': actor.username,
            'note': note,
            'submission_id': submission.id,
        }
    )

    return submission
