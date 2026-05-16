export const SECURITY_METRICS = {
  AUTH_FAILURES: 'auth_failures_total',
  BRUTE_FORCE_LOCKOUTS: 'brute_force_lockouts_total',
  WEBHOOK_SIGNATURE_FAIL: 'webhook_signature_fail_total',
  WEBHOOK_REPLAY_DETECTED: 'webhook_replay_detected_total',
  WEBHOOK_STALE_REJECTED: 'webhook_stale_rejected_total',
  CLERK_SYNC_DRIFT: 'clerk_sync_drift_total',
  CLERK_SYNC_RETRY_EXHAUSTED: 'clerk_sync_retry_exhausted_total',
  NOTIFICATION_OUTBOX_DEAD_LETTER: 'notification_outbox_dead_letter_total',
  NOTIFICATION_DISPATCH_FAILURE: 'notification_dispatch_failure_total',
  RBAC_AUTHORIZATION_DENIED: 'rbac_authorization_denied_total',
};
