# Runbook: Clerk Sync Drift Backlog

## Trigger
Alert: `ClerkSyncRetryExhausted` (P2) fires → `clerk_sync_retry_exhausted_total` > 0.
Cause: Clerk webhook for user create/update/delete failed all retry attempts and is in dead-letter state.

## Impact
- **Blast radius**: Affected user's local DB record is out of sync with Clerk.
- Depending on drift direction:
  - `internal_wins`: local DB record is authoritative — user can still authenticate but Clerk metadata may be stale.
  - `manual_triage`: event requires human review before applying — user state is undetermined.
- No immediate auth outage unless user's Clerk record was deleted.

## Diagnosis
1. Check Grafana **Clerk Sync Health** stat panel — count of retry-exhausted events.
2. Check `clerk_sync_drift_total` panel — identify drift direction breakdown.
3. Query Prometheus: `sum by (direction) (increase(clerk_sync_drift_total[1h]))`.
4. Check user-service logs for `ClerkSyncService` / `ClerkWebhookHandler` dead-letter entries — look for `eventType` and `userId`.
5. Check Clerk dashboard Webhooks → Failed Deliveries for the same event IDs.
6. Assess: Is Clerk webhook endpoint reachable from Clerk's servers? Check network/firewall.

## Containment
1. **Pause reconciliation job** if it is hammering a broken endpoint — prevents cascading failures.
2. Identify affected `userId` values from user-service logs.
3. Check Clerk API health: `curl https://api.clerk.com/v1/users/{userId}` with CLERK_SECRET_KEY.
4. If Clerk is reachable, the failure is likely in the processing logic — do NOT retry automatically yet.
5. Alert `#security-alerts` Slack channel with list of affected user IDs.

## Recovery
1. **Drain dead-letter queue manually**:
   - Identify dead-letter events in user-service (check internal queue or DB table if persisted).
   - Re-process each event: trigger manual sync via admin endpoint or service command.
2. For each affected user:
   - Fetch current state from Clerk: `GET /v1/users/{userId}`.
   - Apply correct upsert to user-service DB.
   - Verify local record matches Clerk source of truth.
3. Re-enable reconciliation job.
4. Monitor `clerk_sync_retry_exhausted_total` — should return to 0.

## Post-mortem
- Analyze root cause of retry exhaustion (transient network vs logic bug vs schema mismatch).
- Review retry policy — consider exponential backoff with jitter if not already implemented.
- Update `docs/security/alert-baselines.md` if threshold needs adjustment.
- Log in `docs/security/drill-log.md`.

## Owner
User service team / Backend on-call

## Escalation
If affected users are unable to authenticate: escalate to P1 and follow RB-01.
If > 10 users affected: notify product and customer success teams.

## SLA
- **P2** — 4 hours to full resolution.
