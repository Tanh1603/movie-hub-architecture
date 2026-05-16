# Security Alert Baselines

This document tracks the derived baselines for security anomaly alerts across the Movie Hub platform. 
Thresholds are established by observing production metrics over a 7-day period and deriving the p99 value plus 3 standard deviations to minimize false positives (< 5%).

## Observation Period

- **Start Date:** YYYY-MM-DD
- **End Date:** YYYY-MM-DD
- **Data Source:** Prometheus `security_metrics_*`

## Derived Thresholds

| Metric | Condition | Derived Threshold | Severity | Description |
|---|---|---|---|---|
| `auth_failures_total` | > threshold in 5m | TBD | P2 | Authentication failures including invalid tokens, expired tokens, or missing tokens. |
| `brute_force_lockouts_total` | > threshold in 1m | 10 (hardcoded) | P1 | Account lockouts due to repeated failed login attempts. |
| `webhook_signature_fail_total`| > threshold in 5m | 5 (hardcoded) | P1 | Webhook signature validation failures indicating potential tampering or attack. |
| `webhook_replay_detected_total`| > threshold in 5m | 3 (hardcoded) | P1 | Webhook requests with already processed idempotency keys. |
| `clerk_sync_retry_exhausted_total` | > 0 | 0 (hardcoded) | P2 | Clerk webhook synchronizations that failed permanently. |
| `notification_outbox_dead_letter_total` | > threshold in 1h| 5 (hardcoded) | P3 | Notifications that could not be delivered to providers. |

## Recalibration Process

1. Run `npm run security:collect-baselines` to pull the latest 7-day metrics from Prometheus.
2. Review the proposed thresholds.
3. Update this document.
4. Update `infrastructure/prometheus/security.rules.yml`.
5. Observe for 24 hours to ensure false positive rate remains < 5%.
