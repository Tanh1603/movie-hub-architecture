# Phase 10 - Monitoring, Alerting, and Incident Runbook

## Objective

Muc tieu la hoan thien bo chi so SLO co kha nang van hanh, canh bao theo nguong ro rang, va quy trinh ung pho su co cho pham vi Member 1. Phase nay khong dong vao business logic va khong hop nhat voi backup/retry phases.

## Non-Goals

- Do NOT create custom observability frameworks or trace processors.
- Do NOT implement APM dashboards or distributed tracing beyond existing infrastructure.
- Do NOT add correlation ID generation (use existing request context).
- Do NOT implement auto-healing or auto-remediation.
- Do NOT create health prediction or ML-based alerting.

## Operational Latency Budget

- Alert evaluation: check conditions every 1 minute
- Alert firing to notification: within 2 minutes
- Dashboard query latency: p95 < 5 seconds

## Scope

- Services affected:
  - `api-gateway`
  - `booking-service`
  - `user-service`
  - `movie-service`
  - `cinema-service`
- Modules affected:
  - none (only small instrumentation adjustments if truly missing)
- Infra/manifests affected:
  - observability/alert rule definitions
  - dashboard definitions
  - incident runbook docs
- Configs affected:
  - SLO/SLI thresholds
  - alert windows and routing

## Prerequisites

- Phases 03-07 completed (health and failover signals stable).
- Baseline logs/metrics pipeline available.

## Tasks

- Define SLI/SLO per service (aligned with ADD requirements):
  - Uptime: 99.9% monthly (allow 43 minutes downtime)
  - Error rate: < 0.1% (1 error per 1000 requests)
  - Booking path p95 latency: <= 3s
  - Browse path p95 latency: <= 2s
- Create alert rules for common failure modes:
  - health probe fail 2 consecutive checks per service
  - error rate > 1% for 5 consecutive minutes
  - p95 latency > 5s for 10 consecutive minutes
  - Redis/PostgreSQL unavailable (any service affected)
- Build operational dashboard showing per-service:
  - replica health status (green/yellow/red)
  - request volume and error rate (rolling 5-minute window)
  - latency percentiles (p50, p95, p99)
  - DB/Redis utilization and timeout counts
- Write concise alert-triage runbook (1 page):
  - health fail → check service logs and DB connectivity
  - error spike → check recent deployments and error traces
  - latency degradation → check resource utilization and query logs
- Do NOT add centralized observability framework or custom trace processing.

## Expected Deliverables

- Alert rule files/config (according to existing observability stack format).
- Dashboard definition files/export artifacts.
- Runbook documentation:
  - `docs/architecture/member1/runbooks/incident-response.md`
  - `docs/architecture/member1/runbooks/alert-triage.md`

## Acceptance Criteria

- Alert simulation (inject health fail, latency spike, error spike) triggers alert within 2 minutes.
- Dashboard displays all core metrics (health, error rate, latency) for all five services.
- On-call runbook supports alert triage end-to-end without escalation loops (unless warranted).
- False-positive alert rate stays below 5% (measured over 1 week staging validation).
- Runbook is executable by on-call without engineering support (clear shell commands, log grep patterns).

## Validation Steps

- Trigger controlled health failure and verify alert firing path.
- Trigger controlled latency degradation and verify threshold alert.
- Run tabletop incident drill with runbook and record gaps.

## Test Plan

- Unit tests:
  - none (unless infra config has local validation tooling)
- Integration tests:
  - alert rule syntax validation in CI if supported
- Failure simulation tests:
  - temporary DB/Redis unavailability scenario
- Staging validation:
  - weekly alert-fire drill
- Operational validation:
  - monthly on-call readiness review with runbook updates

## Risks

- Alert fatigue due to noisy thresholds.
- Missing metrics tags reducing triage usefulness.

## Rollback Strategy

- Revert alert rule and dashboard changes to previous stable baseline.
- Keep runbook updates while disabling noisy rules.

## Architecture Alignment

- ADD:
  - 2.8.1, 2.8.2, 2.8.3
  - 2.6.1 (availability monitoring)
- SAD:
  - 8.3 (logging)
  - 8.4 (monitoring and observability)
  - 10.1 (availability response measures)
- C4:
  - `c4-context.md` (external dependency visibility)
  - `c4-deployment.md` (ops visibility by tier)
  - `c4-dynamic-booking.md` (critical path latency tracking)

# Agent Implementation Prompt

Implement ONLY Phase 10: alerts, dashboards, and incident runbook.

Strict Rules:

1. Inspect current observability stack (metrics backend, alert platform, dashboard tool).
2. Add alert rules (not code, config only):
   - Health probe fail: 2 consecutive failures
   - Error rate: > 1% for 5 minutes
   - Latency: p95 > 5s for 10 minutes
   - Redis/DB unavailable: immediate
3. Build dashboard panels showing per-service:
   - Health status (green/yellow/red)
   - Request volume (rolling 5-min graph)
   - Error rate (rolling 5-min graph)
   - Latency percentiles (p50/p95/p99 in one graph)
4. Write 1-page alert-triage runbook:
   - "Health fail" → check logs with `grep ERROR | tail -50`
   - "Error spike" → check recent deployments and trace top error types
   - "Latency spike" → check resource utilization (CPU/mem/disk) and slow query logs
5. **NO frameworks**: do NOT create custom metrics processors, APM, or trace collectors.
6. **NO abstractions**: keep alerts simple PromQL/query format, not rule engines.
7. Test: inject test failures (stop service, increase latency) and verify alert firing and runbook applicability.
8. Do NOT modify application code or add correlation ID generation.
