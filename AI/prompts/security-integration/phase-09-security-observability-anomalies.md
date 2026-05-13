# Phase 09 - Security Observability & Anomaly Detection

## Objective

Add focused observability for auth and webhook anomalies to support fast detection, triage, and escalation.

## Non-Goals

- Do NOT redesign core monitoring stack owned by reliability team.
- Do NOT add business metrics unrelated to security controls.

## Operational Semantics

- Security events emit structured logs and metrics with correlation context.
- Alerts trigger on threshold breaches for auth failures, lockouts, webhook signature failures, replay spikes.

## Scope

- Services affected:
  - `api-gateway`
  - `booking-service`
  - `user-service`
- Modules affected:
  - security metrics emitters
  - anomaly alert rules
  - dashboard panels

## Prerequisites

- `phase-03-clerk-sync-reliability.md`
- `phase-05-webhook-signature-replay-guard.md`
- `phase-08-sensitive-data-transport-secrets.md`
- TEAM_TASK_DIVISION P2

## Tasks

- Define and emit security counters/histograms:
  - auth_failures_total
  - brute_force_lockouts_total
  - webhook_signature_fail_total
  - webhook_replay_detected_total
  - clerk_sync_drift_total
- Create alert thresholds and routing.
- Build security dashboard panels for on-call triage.
- Ensure logs stay sanitized while retaining actor/action/target/outcome context.

## Expected Deliverables

- security metrics instrumentation
- alert rules for anomaly patterns
- dashboard/runbook linkage

## Acceptance Criteria

- Alerts fire on controlled anomaly simulations.
- Dashboard enables root-cause triage within one screen.
- No sensitive payload exposure in observability data.

## Validation Steps

- Inject synthetic auth failures and replay attempts.
- Verify alert routing and incident annotation quality.

## Test Plan

- Integration: metrics emission in auth and webhook paths
- Operational: alert dry-run and acknowledgement flow

## Risks

- Alert fatigue from noisy thresholds.
- Missing anomaly coverage due to weak event taxonomy.

## Rollback Strategy

- Disable new alert rules if noisy.
- Retain core logs and iterate threshold tuning.

## Architecture Alignment

- TEAM_TASK_DIVISION P2 hardening target

# Agent Implementation Prompt

Implement ONLY Phase 09.

FORBIDDEN:
- Dumping raw request/response payloads into metrics labels or logs.
- Coupling anomaly instrumentation to business transaction success path.

Strict Rules:
1. Use bounded-cardinality metric labels.
2. Alert routing must map to incident ownership.
3. Keep instrumentation overhead low and measurable.
