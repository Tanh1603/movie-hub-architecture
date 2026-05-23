# Phase 10C - Monitoring, Dashboards, and Alert Rules

## Objective

Build actionable Grafana dashboards and Prometheus alert rules on top of Phase 10B metrics.

## Scope

- Define core SLI/SLO views for availability, latency, and error rate.
- Add Prometheus alert rules for service health and performance regressions.
- Provision Grafana dashboards and data source configuration.
- Document query set used by dashboards and alerts.

## Non-Goals

- Adding or changing service instrumentation (Phase 10B scope).
- Incident runbook authoring and on-call drill execution (Phase 10D).
- AlertManager notification routing redesign unless explicitly required.
- Tracing platform rollout.

## Prerequisites

- Phase 10A complete (infra available).
- Phase 10B complete (`/metrics` endpoints functioning).
- Baseline traffic available for threshold sanity checks.

## Tasks / Implementation Steps

1. Define initial SLO targets and corresponding PromQL expressions.
2. Create Prometheus alert rule file(s) for:
   - service down
   - high error rate
   - high latency
   - low throughput (optional)
3. Add Grafana dashboards for:
   - platform overview
   - per-service health and latency
   - booking flow critical path
4. Wire provisioning files for deterministic environment bootstrap.
5. Validate alert firing in staging with controlled test conditions.
6. Record threshold rationale and known tuning follow-ups.

- Severity labels:
  critical
  warning

- Store Prometheus rules under:
  infra/prometheus/rules/

## Deliverables

- Alert rules committed under infrastructure monitoring config.
- Grafana dashboard JSON/provisioning files committed.
- Query catalog for dashboard panels and alerts.
- Initial threshold rationale notes.

## Acceptance Criteria

- Dashboards load successfully after provisioning.
- Alert rules load without Prometheus parsing errors.
- At least one controlled test per key alert confirms firing behavior.
- Dashboard panels visualize metrics produced in Phase 10B.
- No runbook/process workflow content added in this phase.

## Validation Steps

```bash
# Validate Prometheus config and rules (if promtool available)
promtool check config infra/prometheus/prometheus.yml
promtool check rules infra/prometheus/rules/*.yml

# Restart monitoring stack after rule/dashboard updates
docker-compose restart prometheus grafana

# Verify
# http://localhost:9090/rules
# http://localhost:3009
```

## Risks (short)

- Alert noise from premature thresholds.
- Blind spots from missing panels for critical paths.
- Dashboard drift if metrics names change later.

## Rollback (short)

1. Revert alert rule and dashboard provisioning changes.
2. Restart Prometheus and Grafana.
3. Keep Phase 10B metrics collection running unchanged.

## Agent Prompt / Notes

- Implement monitoring assets only (rules, dashboards, queries).
- Reuse Phase 10B metric names; do not add instrumentation here.
- Keep outputs simple, versioned, and deterministic for CI/CD.
- Maintain ADD/SAD/TEAM_TASK_DIVISION alignment for observability quality attributes.
