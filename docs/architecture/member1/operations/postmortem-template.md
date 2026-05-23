# Postmortem Template

Use this template after incidents that meet the Phase 10D postmortem threshold.

## Trigger Criteria

- P1 incident
- P2 incident lasting more than 15 minutes
- Recurring incident pattern
- Unexpected failure mode or unclear root cause

## Template

```markdown
# Incident Postmortem

**Incident ID:** [ID]
**Date:** [YYYY-MM-DD]
**Severity:** [P1 | P2 | P3 | P4]
**Primary Owner:** [name]
**Service(s):** [service names]

## Summary

[Two to four sentences describing the incident, impact, and resolution]

## Customer / Operator Impact

- Start time: [timestamp]
- End time: [timestamp]
- Duration: [minutes]
- Impact summary: [what was affected]

## Detection

- Alert name: [name]
- Detection source: [Prometheus | Grafana | manual]
- Time to acknowledge: [minutes]

## Timeline

- [HH:MM] alert fired
- [HH:MM] triage started
- [HH:MM] mitigation applied
- [HH:MM] service recovered
- [HH:MM] incident closed

## Root Cause

[What failed and why]

## Response Review

- What worked:
- What was slow:
- What was missing:

## Corrective Actions

| Owner  | Action   | Priority          | Due Date | Status        |
| ------ | -------- | ----------------- | -------- | ------------- |
| [name] | [action] | [high/medium/low] | [date]   | [open/closed] |

## Prevention

[Runbook, alert, or workflow updates required]

## Links

- Runbook: [link]
- Incident log: [link]
- Supporting evidence: [links]
```

## Notes

- Keep the review blameless and systems-focused.
- Limit action items to the smallest set that prevents recurrence or reduces time to recover.
- Update the relevant runbook if the incident revealed a gap.
