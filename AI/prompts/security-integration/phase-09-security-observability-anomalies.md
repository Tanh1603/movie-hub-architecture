# Phase 09 - Security Observability & Anomaly Detection

## Objective

Add focused observability for auth, webhook, and notification anomalies to support fast detection, triage, and escalation — with calibrated thresholds based on baseline traffic patterns.

## Non-Goals

- Do NOT redesign core monitoring stack owned by reliability team.
- Do NOT add business metrics unrelated to security controls.
- Do NOT replace existing application performance monitoring (APM).

## Operational Semantics

- Security events emit structured logs and metrics with correlation context.
- Alerts trigger on threshold breaches for auth failures, lockouts, webhook signature failures, replay spikes.
- Alert thresholds are calibrated after a baselining observation period.
- All metrics use bounded-cardinality labels to prevent metric explosion.

## Scope

- Services affected:
  - `api-gateway`
  - `booking-service`
  - `user-service`
- Modules affected:
  - security metrics emitters
  - anomaly alert rules
  - dashboard panels
  - baselining data collection

## Prerequisites

- `phase-03-clerk-sync-reliability.md`
- `phase-05-webhook-signature-replay-guard.md`
- `phase-07-notification-adapter-outbox.md`
- `phase-08-sensitive-data-transport-secrets.md`
- TEAM_TASK_DIVISION P2

## Tasks

- Define and emit security counters/histograms:
  - `auth_failures_total` (labels: `reason=[invalid_token|expired|missing|lockout]`)
  - `brute_force_lockouts_total` (labels: `endpoint`)
  - `webhook_signature_fail_total` (labels: `provider=[vnpay|zalopay]`)
  - `webhook_replay_detected_total` (labels: `provider`)
  - `webhook_stale_rejected_total` (labels: `provider`)
  - `clerk_sync_drift_total` (labels: `direction=[internal_wins|manual_triage]`)
  - `clerk_sync_retry_exhausted_total`
  - `notification_outbox_dead_letter_total` (labels: `event_type`)
  - `notification_dispatch_failure_total` (labels: `provider=[email|sms|push]`)
  - `rbac_authorization_denied_total` (labels: `role`, `resource`)
- Implement **alert baselining period**:
  - deploy metrics collection in observation-only mode for minimum 7 days
  - collect p50/p95/p99 of each security counter per hour
  - derive alert thresholds as: `p99 + 3 * stddev` for spike alerts
  - document baseline values in `docs/security/alert-baselines.md`
  - only enable alerting AFTER baseline is established
- Create alert thresholds and routing:
  - `auth_failures_total` > baseline threshold in 5-min window → P2 alert
  - `brute_force_lockouts_total` > 10 in 1-min window → P1 alert
  - `webhook_signature_fail_total` > 5 in 5-min window → P1 alert (possible attack)
  - `webhook_replay_detected_total` > 3 in 5-min window → P1 alert
  - `clerk_sync_retry_exhausted_total` > 0 → P2 alert (triage queue)
  - `notification_outbox_dead_letter_total` > 5 in 1-hour window → P3 alert
- Define alert routing:
  - P1 → on-call security engineer (PagerDuty/Slack)
  - P2 → security channel (Slack)
  - P3 → weekly security triage queue
- Build security dashboard panels for on-call triage:
  - auth failure rate over time (line chart)
  - webhook anomaly breakdown by provider (stacked bar)
  - clerk sync health (drift count, retry exhaustion)
  - notification delivery health (success/failure/dead-letter)
  - active brute-force lockouts (gauge)
- Ensure logs stay sanitized while retaining actor/action/target/outcome context.
- Target: **false positive rate < 5%** after baselining period.

## Expected Deliverables

- security metrics instrumentation across all affected services
- alert rules with threshold documentation
- baseline data collection job/script
- `docs/security/alert-baselines.md` template
- security dashboard (Grafana/equivalent) definition
- dashboard/runbook linkage

## Acceptance Criteria

- Alerts fire on controlled anomaly simulations.
- Dashboard enables root-cause triage within one screen.
- No sensitive payload exposure in observability data.
- Alert thresholds are documented with baseline derivation, not arbitrary.
- False positive rate < 5% validated over 7-day observation period.
- P1 alerts reach on-call within 2 minutes of threshold breach.

## Validation Steps

- Inject synthetic auth failures (10 in 1 minute) and verify alert fires.
- Inject synthetic replay attempts and verify webhook alert fires.
- Verify alert routing reaches correct channel per priority.
- Verify dashboard panels update in real-time during simulation.
- Run 7-day observation, compare baseline vs actual alert volume.

## Test Plan

- Integration: metrics emission in auth and webhook paths
- Integration: notification dead-letter counter increments on provider failure
- Operational: alert dry-run and acknowledgement flow
- Operational: baseline collection script produces valid output

## Risks

- Alert fatigue from noisy thresholds (mitigated by baselining period).
- Missing anomaly coverage due to weak event taxonomy.
- Baseline drift over time requiring periodic re-calibration.
- Metric cardinality explosion from unbounded labels.

## Rollback Strategy

- Disable new alert rules if noisy (keep in observation mode).
- Retain core logs and iterate threshold tuning.
- Downgrade P2/P3 alerts to logs-only if false positive rate > 10%.

## Architecture Alignment

- TEAM_TASK_DIVISION P2 hardening target

# Agent Implementation Prompt

Implement ONLY Phase 09.

FORBIDDEN:
- Dumping raw request/response payloads into metrics labels or logs.
- Coupling anomaly instrumentation to business transaction success path.
- Enabling alerts without documented baseline thresholds.
- Using unbounded-cardinality labels (e.g., userId, IP, requestId as metric labels).

Strict Rules:
1. Use bounded-cardinality metric labels only.
2. Alert routing must map to incident ownership (P1/P2/P3 → channel).
3. Keep instrumentation overhead low and measurable.
4. Baseline MUST be collected for minimum 7 days before enabling alerts.
5. Document threshold derivation in `docs/security/alert-baselines.md`.
6. False positive rate target: < 5%.
