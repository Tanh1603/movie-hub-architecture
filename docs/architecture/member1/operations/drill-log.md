# Phase 10D Drill Log

Use this file to record tabletop drills and staged alert simulations for incident runbooks.

## Drill Cadence

- Tabletop drill: monthly
- Staged alert simulation: monthly
- Runbook review after every drill: within 2 business days

## Drill Types

### 1. Tabletop Drill

Scenario examples:

- `MovieHubServiceDown` on `booking-service`
- `MovieHubHighErrorRate` on `api-gateway`
- `MovieHubHighLatencyP95` on `movie-service`

Expected operator actions:

1. Acknowledge the alert.
2. Classify severity.
3. Execute the matching runbook.
4. Record mitigation steps and outcome.
5. Escalate if recovery target is missed.

### 2. Staged Alert Simulation

Suggested setup:

- Trigger a known alert in a controlled environment.
- Keep the change isolated to one service.
- Validate detection, triage, and closure steps.

Suggested checks:

- Prometheus alert appears in `http://localhost:9090/alerts`
- Service logs show the expected failure pattern
- Health endpoint recovers after mitigation

## Drill Record Template

```markdown
## Drill Record

**Date:** [YYYY-MM-DD]
**Facilitator:** [name]
**Responder:** [name]
**Scenario:** [alert name and service]
**Type:** [tabletop | staged simulation]
**Duration:** [minutes]

### Goal

[What the drill was intended to validate]

### What Happened

[Short timeline of actions taken]

### What Worked

- [item]

### What Slowed Us Down

- [item]

### Outcome

- [resolved | escalated | partial]

### Follow-up Actions

- [owner] - [action] - [due date]
```

## Completed Drill Log

| Date      | Scenario  | Type      | Outcome   | Follow-up |
| --------- | --------- | --------- | --------- | --------- |
| [pending] | [pending] | [pending] | [pending] | [pending] |
