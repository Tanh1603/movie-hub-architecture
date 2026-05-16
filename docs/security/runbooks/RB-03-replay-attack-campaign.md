# Runbook: Replay Attack Campaign

## Trigger
Alert: `WebhookReplayDetected` (P1) fires → `webhook_replay_detected_total` > 3 in 5-minute window.
Likely cause: attacker replaying previously captured valid IPN callbacks to trigger duplicate payment confirmations.

## Impact
- **Blast radius**: Duplicate payment confirmations attempted — dedup guard prevents state mutation, but attack consumes resources.
- If dedup guard has a bug, replay could cause double-ticket issuance or duplicate loyalty credit.
- Sustained attack degrades booking-service throughput.

## Diagnosis
1. Check Grafana **Webhook Anomalies** panel — confirm `webhook_replay_detected_total` spike by provider.
2. Query: `sum by (provider) (increase(webhook_replay_detected_total[5m]))`.
3. Check booking-service logs for `auditSuspiciousCallback` with reason `duplicate` — look for `dedupIdentity` patterns.
4. Check if same `transactionId`/`orderId` values are repeating — extract from logs.
5. Analyze timestamp patterns: `callbackTimestamp` in audit log — all replays likely have timestamps in the same historical window.
6. Check `webhook_stale_rejected_total` — if also elevated, attacker may be using both fresh and stale callbacks.

## Containment
1. **Tighten timestamp tolerance** (immediate): reduce `WEBHOOK_FRESHNESS_WINDOW_MS` env var from default (e.g., 5 min → 2 min).
   - This invalidates older captured callbacks without disrupting legitimate providers.
   - Requires `booking-service` restart.
2. **Block suspicious IPs at WAF/CDN** if IP pattern is identifiable from access logs.
3. Alert `#on-call-security` via PagerDuty with attack start time and provider affected.
4. Do NOT rotate webhook secret yet — dedup guard is handling it; secret rotation may cause legitimate callbacks to fail.

## Recovery
1. Monitor `webhook_replay_detected_total` — should decline as attacker's captured tokens become stale.
2. If attack persists beyond 30 minutes: rotate the provider webhook secret.
   - Follow RB-02 secret rotation procedure.
3. Restore `WEBHOOK_FRESHNESS_WINDOW_MS` to normal value once replay rate normalizes.
4. Audit any bookings confirmed during attack window — verify no duplicate issuance:
   ```sql
   SELECT booking_id, COUNT(*) as ticket_count FROM tickets
   WHERE created_at > '<attack_start>'
   GROUP BY booking_id HAVING COUNT(*) > (
     SELECT COUNT(*) FROM showtime_seats WHERE booking_id = tickets.booking_id
   );
   ```

## Post-mortem
- Review dedup Redis key TTL — ensure it covers the attack window duration.
- Evaluate adding IP-based rate limiting at application layer as secondary defense.
- Document in `docs/security/drill-log.md`.

## Owner
Security on-call

## Escalation
If not contained in **15 minutes** or if dedup guard appears bypassed: escalate to security lead immediately.

## SLA
- **P1** — 15 minutes to containment, 1 hour to full resolution.
