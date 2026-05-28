# Runbook: Webhook Signature Failure Spike

## Trigger
Alert: `WebhookSignatureFailures` (P1) fires → `webhook_signature_fail_total` > 5 in 5-minute window.
Possible causes: provider rotated webhook secret, MITM tampering, or misconfigured payment gateway.

## Impact
- **Blast radius**: All IPN callbacks from affected provider (VNPay / ZaloPay) are rejected.
- Payments that completed at provider side are not confirmed on platform — bookings remain `PENDING`.
- Revenue at risk: unconfirmed paid bookings will expire if not resolved within booking TTL.

## Diagnosis
1. Check Grafana **Webhook Anomalies by Provider** panel — identify which provider (`vnpay` or `zalopay`).
2. Query: `sum by (provider) (increase(webhook_signature_fail_total[5m]))`.
3. Cross-reference with `webhook_replay_detected_total` — elevated replay + sig failures suggest active attack.
4. Check booking-service logs for `auditSuspiciousCallback` entries — look for `invalid_signature` reason.
5. Verify provider dashboard for any key rotation notices or incident announcements.
6. Verify `VNPAY_HASH_SECRET` / `ZALOPAY_KEY2` env vars match current provider portal values.

## Containment
1. **If key mismatch (no attack)**: update the affected secret env var and restart `booking-service`.
2. **If suspected attack**:
   - Verify `webhook_stale_rejected_total` — if also spiking, replay attack is likely concurrent.
   - Do NOT update the secret until replay pattern is analyzed.
   - Check WAF/CDN for suspicious IP ranges sending repeated IPN requests.
3. Alert `#on-call-security` via PagerDuty with provider and spike start time.

## Recovery
1. Confirm secret update is correct by sending a test IPN from provider sandbox.
2. Verify `webhook_signature_fail_total` rate drops to near-zero.
3. Manually confirm any stuck PENDING bookings — query:
   ```sql
   SELECT id, booking_id, status, created_at FROM payments
   WHERE status = 'PENDING' AND created_at > NOW() - INTERVAL '1 hour';
   ```
4. For confirmed paid bookings stuck as PENDING: coordinate manual confirmation with finance team.

## Post-mortem
- Document secret rotation procedure to prevent future mismatch.
- Evaluate adding pre-rotation grace period (accept both old and new secret for 30 min).
- Update `docs/security/alert-baselines.md` if threshold needs recalibration.

## Owner
Backend / Payments team + Security on-call

## Escalation
If not contained in **30 minutes**: escalate to payments team lead and contact provider support.

## SLA
- **P1** — 30 minutes to containment, 2 hours to full resolution.
