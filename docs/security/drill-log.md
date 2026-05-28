# Security Tabletop Drill Log

Quarterly drills validate runbook accuracy and team readiness. Each drill entry must include date, scenario, participants, findings, and action items.

---

## Drill Schedule

| Quarter | Planned Date | Scenario | Status |
|---------|-------------|----------|--------|
| Q2 2026 | TBD | Auth outage / JWKS rotation (RB-01) | Planned |
| Q3 2026 | TBD | Webhook signature failure (RB-02) | Planned |
| Q4 2026 | TBD | Replay attack campaign (RB-03) | Planned |
| Q1 2027 | TBD | Brute-force surge (RB-05) | Planned |

Rotate through all 5 runbooks annually. Re-run failed scenarios in the following quarter.

---

## Drill Entry Template

```
## Drill: <YYYY-MM-DD> — <Scenario Name>

**Runbook:** RB-XX-<filename>.md
**Participants:** <names / roles>
**Facilitator:** <name>
**Duration:** <minutes>

### Steps Executed
1. [ ] Trigger condition simulated: <how>
2. [ ] Diagnosis steps followed: <observations>
3. [ ] Containment applied: <actions taken>
4. [ ] Recovery validated: <verification method>

### Findings
- Gap found: <description>
- Runbook step unclear: <which step>
- Tool/access missing: <what>

### Action Items
| Item | Owner | Due Date |
|------|-------|----------|
| | | |

### Outcome
- [ ] Runbook executed within SLA
- [ ] No gaps found
- [ ] Runbook updated post-drill
```

---

<!-- Add completed drill entries below this line -->
