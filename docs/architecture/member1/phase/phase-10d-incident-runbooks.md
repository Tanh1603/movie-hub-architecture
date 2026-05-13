# Phase 10D - Incident Runbooks and Alert Triage Operations

## Objective

Operationalize observability by delivering concise, executable incident runbooks and triage workflows for on-call response.

## Scope

- Write runbooks for top alert categories produced in Phase 10C.
- Define triage flow: detect -> classify -> mitigate -> escalate -> close.
- Include copy-paste commands for diagnosis and mitigation.
- Add a lightweight drill cadence and post-incident review template.

## Non-Goals

- Changing dashboard/alert technical implementation (Phase 10C).
- Adding new instrumentation or metrics schema (Phase 10B).
- Refactoring business logic as part of incident process work.
- Replacing incident tooling platform.

## Prerequisites

- Phase 10A complete (monitoring infrastructure).
- Phase 10B complete (metrics instrumentation).
- Phase 10C complete (alerts and dashboards active).
- On-call ownership and escalation contacts identified.

## Tasks / Implementation Steps

1. Create alert-to-runbook mapping table (every key alert has an owner and procedure).
2. Write runbook sections per alert type:
   - symptom and impact
   - quick checks
   - detailed diagnostics
   - mitigation steps
   - escalation criteria
3. Add standard command blocks for Docker, logs, health checks, and Prometheus/Grafana lookups.
4. Create incident timeline template and postmortem action-item template.
5. Run one tabletop drill and one staged alert simulation.
6. Incorporate findings and publish final runbook pack.

- Include expected recovery time and escalation owner per alert category.

## Deliverables

- `alert-triage.md` (or equivalent) with per-alert steps.
- `incident-response.md` decision flow.
- `troubleshooting-guide.md` command cookbook.
- `drill-log.md` and postmortem template.

## Acceptance Criteria

- Every critical Phase 10C alert maps to a concrete runbook section.
- Commands are executable and verified in current environment.
- Escalation thresholds and ownership are explicit.
- At least one drill completed and documented.
- No infra/instrumentation redesign introduced in this phase.

## Validation Steps

```bash
# Example checks used in runbooks
curl -f http://localhost:3000/health/live
curl -f http://localhost:3005/health/live

# Service log checks (example)
docker-compose logs --tail=200 booking-service
docker-compose logs --tail=200 api-gateway

# Monitoring checks
# http://localhost:9090/alerts
# http://localhost:3009
```

## Risks (short)

- Runbooks become stale if not reviewed after changes.
- Ambiguous ownership increases MTTR.
- Overly long procedures reduce operator usability.

## Rollback (short)

1. Revert runbook document changes to last stable revision.
2. Keep Phase 10A/10B/10C technical assets running.
3. Re-run drill with previous version if needed.

## Agent Prompt / Notes

- Optimize for on-call execution speed, not narrative depth.
- Keep each runbook section short, command-first, and deterministic.
- Preserve strict phase boundary: 10D is operations only.
- Keep alignment with ADD/SAD/TEAM_TASK_DIVISION operational observability intent.
