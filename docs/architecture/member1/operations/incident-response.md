# Incident Response Decision Flow

**Phase 10D Operational Observability**

## Incident Lifecycle

Every incident follows this flow: **Detect → Classify → Mitigate → Escalate → Document → Close**

---

## 1. Detect: Alert Firing

**Action:** When alert lands in on-call Slack channel:

```
☑ Acknowledge alert in incident tracking tool within 5 minutes
☑ Note exact alert name and timestamp
☑ Verify alert is not a false positive:
  - Check Prometheus rules page: http://localhost:9090/rules
  - Check affected service logs for actual problem
  - If false positive, suppress and document why
```

---

## 2. Classify: Determine Incident Severity

### Severity Levels

| Level           | Definition                                        | Response Time | Escalation                             |
| --------------- | ------------------------------------------------- | ------------- | -------------------------------------- |
| **P1 Critical** | Service completely down; customer impact imminent | < 5 min       | Immediate escalation to Lead           |
| **P2 High**     | Degraded service; some customers affected         | < 15 min      | Escalate within 15 min if not resolved |
| **P3 Medium**   | Warnings; no immediate customer impact            | < 30 min      | Can group into incident review         |
| **P4 Low**      | Informational; no impact                          | < 4 hours     | Document and include in weekly review  |

### Mapping Alerts to Severity

```
MovieHubServiceDown (critical alert)
  ↓
P1 Critical - Service completely unavailable
  - Response Time: < 5 min
  - Immediate escalation to @platform-engineer-on-call

MovieHubHighErrorRate (warning alert)
  ↓
P2 High - Degraded reliability
  - Response Time: < 15 min
  - Escalate if not resolved in 15 min

MovieHubHighLatencyP95 (warning alert)
  ↓
P3 Medium - Performance degraded but working
  - Response Time: < 30 min
  - No immediate escalation unless pattern is recurring
```

### Classification Decision Tree

```
INCIDENT CLASSIFIED?
  │
  ├─ YES, P1 Critical
  │   └─ [CRITICAL PATH]: Execute immediately
  │       ├─ Follow alert-specific runbook (Runbook 1/2/3)
  │       ├─ Execute triage commands from troubleshooting-guide.md
  │       ├─ If > 10 min and unresolved → Escalate immediately
  │       └─ [PROCEED TO SECTION 4: ESCALATE]
  │
  ├─ YES, P2 High
  │   └─ [STANDARD PATH]: Execute systematically
  │       ├─ Follow alert-specific runbook
  │       ├─ Execute triage commands
  │       ├─ If > 15 min and unresolved → Escalate
  │       └─ [PROCEED TO SECTION 4: ESCALATE]
  │
  ├─ YES, P3 Medium
  │   └─ [STANDARD PATH]: Execute over 30 min window
  │       ├─ Follow runbook steps methodically
  │       ├─ Monitor improvements
  │       ├─ If resolved in < 30 min → Document and close
  │       └─ If unresolved → Can wait for business hours escalation
  │
  └─ YES, P4 Low
      └─ [LOW PRIORITY PATH]: Document and batch
          └─ Include in weekly observability review
```

---

## 3. Mitigate: Execute Runbook

### Mitigation Decision Tree

**Choose the runbook based on alert:**

1. **ServiceDown → Alert Triage Runbook 1**

   - Identify which service is down
   - Execute "Quick Checks" (< 2 min)
   - Execute "Detailed Diagnostics" if needed (< 5 min)
   - Pick appropriate mitigation "Option A/B/C/D"
   - Verify resolution

2. **HighErrorRate → Alert Triage Runbook 2**

   - Identify affected service
   - Execute quick checks
   - Identify error pattern (database, dependency, code)
   - Pick appropriate mitigation option
   - Monitor error rate for recovery

3. **HighLatencyP95 → Alert Triage Runbook 3**
   - Identify affected service
   - Execute quick checks
   - Identify bottleneck (CPU/DB/network)
   - Pick appropriate mitigation option
   - Monitor latency for recovery

### Mitigation Checklist

For **every incident**, follow this sequence:

```
MITIGATION SEQUENCE
┌────────────────────────────────────────────────────────┐
│ 1. Read alert annotation in Prometheus                 │
│    - Service name, job, reason                         │
│                                                         │
│ 2. Open corresponding runbook (1/2/3)                  │
│                                                         │
│ 3. Execute Quick Checks (2 min)                        │
│    - Is it real? (check Prometheus, logs, service)    │
│    - If false positive, suppress rule and document    │
│                                                         │
│ 4. If unresolved after Quick Checks:                   │
│    - Execute Detailed Diagnostics (5 min)             │
│    - Identify root cause from logs/metrics             │
│                                                         │
│ 5. Pick mitigation option that matches diagnosis       │
│    - Execute mitigation commands                       │
│    - Wait for service to stabilize (30-60 sec)        │
│                                                         │
│ 6. Verify resolution:                                  │
│    - Check service health endpoint                     │
│    - Check Prometheus alert state                      │
│    - Check dashboard for green status                  │
│                                                         │
│ 7. If resolved → [CLOSE INCIDENT - See Section 5]     │
│    If NOT resolved after 10+ min → [ESCALATE]         │
└────────────────────────────────────────────────────────┘
```

---

## 4. Escalate: When to Involve Specialists

### Escalation Criteria

**Escalate if ANY of these are true:**

- Incident not resolved after following runbook for > 10 minutes (P1)
- Pattern suspected to be infrastructure-level (all services affected)
- Database corruption or data loss suspected
- Code defect suspected (need code review)
- Unknown root cause after diagnostics

### Escalation Ownership Matrix

```
INCIDENT TYPE → ESCALATE TO → CONTACT → AVAILABLE
─────────────────────────────────────────────────────────
ServiceDown (P1)
  └─ Platform Engineering → @platform-engineer-on-call
      └─ Available: 24/7 on-call rotation

HighErrorRate (P2)
  ├─ Service Code Issue? → Service Team Lead → Business hours
  └─ Infrastructure Issue? → Platform Eng → @platform-engineer-on-call

HighLatencyP95 (P2)
  ├─ Database Issue? → Database Team → Business hours
  ├─ Code Issue? → Service Team → Business hours
  └─ Infrastructure? → Platform Eng → @platform-engineer-on-call

Database Down
  └─ Database Team → @dba-on-call → 24/7 on-call

All Services Down
  └─ Platform Lead → @platform-lead → On-call per rotation
```

### Escalation Message Template

**When escalating, provide:**

```
🚨 ESCALATION: [Alert Name] - [Severity Level]

⏱ Timeline:
  - Alert fired: [HH:MM UTC]
  - Triage started: [HH:MM UTC]
  - Escalation time: [HH:MM UTC]
  - Duration: [X minutes]

📊 Diagnosis so far:
  - Affected service: [service-name]
  - Quick checks completed: [Yes/No]
  - Root cause identified: [Yes/No - describe if yes]
  - Mitigation attempted: [describe what was tried]
  - Current status: [running/crashed/degraded/unknown]

📝 Evidence:
  - Last 50 lines of service logs: [paste]
  - Docker stats output: [paste]
  - Relevant Prometheus metric: [paste]
  - Dashboard snapshot: [link]

🔍 Next steps for specialist:
  - [List specific things you need help investigating]

📞 Point of contact: [Your name/Slack handle]
```

### Escalation Decision Point

```
INCIDENT TRIAGE IN PROGRESS
  │
  ├─ After 5 minutes:
  │   ├─ RESOLVED? → [CLOSE INCIDENT]
  │   ├─ ROOT CAUSE FOUND? → Continue mitigation
  │   └─ ROOT CAUSE UNCLEAR?
  │       └─ Is this P1 Critical?
  │           ├─ YES → Escalate immediately
  │           └─ NO → Continue diagnostics
  │
  ├─ After 10 minutes:
  │   ├─ RESOLVED? → [CLOSE INCIDENT]
  │   ├─ CLOSE TO RESOLVED? → Continue, monitor closely
  │   └─ NOT RESOLVED?
  │       └─ Is mitigation making progress?
  │           ├─ YES → Continue, re-evaluate at 15 min
  │           └─ NO → [ESCALATE IMMEDIATELY]
  │
  └─ After 15 minutes:
      ├─ RESOLVED? → [CLOSE INCIDENT]
      ├─ P1 or P2 and still not resolved?
      │   └─ [ESCALATE NOW]
      └─ P3 or P4?
          └─ Can continue diagnostics or escalate if blocked
```

---

## 5. Close: Incident Resolution and Documentation

### Resolution Prerequisites

Before closing an incident, **ALL** of these must be true:

```
☑ Service is responding normally
☑ Alert state shows "inactive" (not firing)
☑ Dashboard shows green/healthy status
☑ No recurring errors in logs
☑ Metrics show normal trends
☑ Manual verification test passed
☑ Postmortem started (or scheduled within 24 hours)
```

### Resolution Verification Checklist

**For each incident, run these final checks:**

#### If ServiceDown (Critical)

```bash
# Verify service is healthy
docker compose exec booking-service wget -qO- http://localhost:3005/health/live && echo "✓ Service alive"

# Verify metrics endpoint works
docker compose exec booking-service wget -qO- http://localhost:3005/metrics | Select-Object -First 5 && echo "✓ Metrics endpoint"

# Verify Prometheus sees it
curl.exe -s "http://localhost:9090/api/v1/query?query=up{job=~'.*booking.*'}" | findstr /C:'"status":"success"' && echo "✓ Prometheus sees service"

# Verify alert is not firing
curl.exe -s http://localhost:9090/api/v1/alerts | findstr /C:'MovieHubServiceDown' /C:'"state":"inactive"' && echo "✓ Alert resolved"
```

#### If HighErrorRate (Warning)

```bash
# Verify error rate dropped below 5%
curl.exe -s "http://localhost:9090/api/v1/query?query=rate(moviehub_http_requests_total{status=~'5..'}[5m])" | findstr /C:'"status":"success"' && echo "✓ Error rate query returned"

# Verify last N requests have no 5xx
docker compose logs --since 2m <affected-service> | grep -i "5[0-9]{2}" || echo "✓ No recent 5xx errors"

# Check dashboard
echo "ℹ Check http://localhost:3009 dashboard - error rate should be green"
```

#### If HighLatencyP95 (Warning)

```bash
# Verify P95 latency dropped below 2 seconds
curl.exe -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(moviehub_http_request_duration_seconds_bucket[5m]))by(job,le))" | findstr /C:'"status":"success"' && echo "✓ P95 latency query returned"

# Check dashboard
echo "ℹ Check http://localhost:3009 dashboard - latency should be green"
```

### Incident Log Entry

**After resolution, record in incident log (or ticket system):**

```markdown
## Incident: [Alert Name]

**Date/Time:** [YYYY-MM-DD HH:MM UTC]
**Duration:** [X minutes]
**Severity:** P[1-4]
**Status:** ✅ RESOLVED

### Timeline

- 15:32 UTC - Alert fired (ServiceDown - booking-service)
- 15:34 UTC - Triage started, service container found crashed
- 15:36 UTC - Restarted container with `docker compose restart booking-service`
- 15:37 UTC - Service came online, alert cleared
- 15:38 UTC - Manual verification passed, incident closed

### Root Cause

Database connection timeout during initialization. Container OOMKilled when Prisma migration ran.

### Resolution

Increased service memory limit from 512MB to 1GB in docker-compose.yml.

### Impact

- Duration: 5 minutes
- Affected: booking-service metrics scraping, no API impact
- Customers: None (internal monitoring only)

### Follow-up

- [ ] Add memory limit documentation to runbook
- [ ] Schedule review with database team on Prisma migration memory usage
- [ ] Consider gradual deployment health checks
```

### Close Incident Checklist

```
Before considering incident closed:

☑ Service is healthy and responding
☑ All verification checks passed
☑ Alert is in "inactive" state
☑ Team notified of resolution
☑ Postmortem scheduled (or completed)
☑ Root cause documented
☑ Follow-up actions recorded
☑ Incident entry closed in tracking system
```

---

## 6. Learn: Postmortem Process

### Postmortem Trigger Criteria

**Schedule postmortem if:**

- Incident duration > 15 minutes
- Severity P1 or P2
- Root cause was unexpected or unclear

### Postmortem Timing

- **P1 Critical incidents:** Within 24 hours
- **P2 High incidents:** Within 48 hours
- **P3 Medium incidents:** Optional, group into weekly review

### Postmortem Attendees

- **Required:** Incident responder, service owner, platform team lead
- **Optional:** Affected team members, related service owners
- **Not required:** General population (results shared in summary)

### Postmortem Topics

```
1. What happened? (Incident timeline)
2. Why did it happen? (Root cause analysis)
3. How did we respond? (Evaluation of runbook)
4. What went well? (Praise process/tools)
5. What could be better? (Improvement areas)
6. What actions are we taking? (Specific follow-ups)
```

### Postmortem Output

**Every postmortem produces:**

1. **Root Cause Summary** (1-2 paragraphs)

   - What failed
   - Why it failed
   - Why we didn't catch it earlier

2. **Action Items** (max 5, prioritized)

   - Code fixes
   - Runbook updates
   - Monitoring improvements
   - Documentation updates

3. **Blameless Culture Note**
   - Focus on systems and processes, not individuals
   - "How could the system have prevented this?" not "Who made the mistake?"

---

## Contacts and Escalation Path

### On-Call Rotation

| Role              | Contact        | Available                | Escalation                              |
| ----------------- | -------------- | ------------------------ | --------------------------------------- |
| On-Call Ops       | @on-call-ops   | 24/7                     | First contact for infrastructure alerts |
| Platform Lead     | @platform-lead | On rotation              | Escalation for platform-wide issues     |
| Database Team     | @dba-on-call   | Business hours + on-call | Database failures, corruption           |
| Service Team Lead | @service-lead  | Business hours           | Code defects, business logic issues     |

### Communication Channels

- **Incident declaration:** #incident-response Slack channel
- **On-call escalation:** @platform-engineer-on-call mention
- **Critical incidents:** Page via PagerDuty (if configured)
- **All-hands critical:** #general announcement

### Response SLOs

| Severity | First Response | Mitigation Target | Escalation Trigger        |
| -------- | -------------- | ----------------- | ------------------------- |
| P1       | 5 min          | 15 min            | 10 min if unresolved      |
| P2       | 15 min         | 30 min            | 15 min if unresolved      |
| P3       | 30 min         | 60 min            | Business hours escalation |

---

## Common Escalation Scenarios

### Scenario 1: ServiceDown, cannot restart service

**Action:**

1. Verify database is healthy
2. Check for disk space issues
3. Review container build logs
4. If all checks pass but service won't start → Escalate immediately

**Escalate to:** Platform Engineering
**Message:** "Service won't start even after rebuild. Database healthy, disk OK. Build logs show: [error]. Need code review."

### Scenario 2: HighErrorRate, pattern unclear

**Action:**

1. Check if database queries are slow
2. Check if external service is called
3. Look for common error message
4. If no clear cause → Escalate

**Escalate to:** Service Team Lead
**Message:** "Error rate 8% on [service]. Logs show [error message] but no obvious cause. Database responding normally. Logs: [100 lines]"

### Scenario 3: HighLatencyP95, resource constrained

**Action:**

1. Verify service CPU/memory at limit
2. Check if load is legitimate
3. If resource constrained → Escalate for scaling decision

**Escalate to:** Platform Lead
**Message:** "P95 latency 3.2s on [service]. Service CPU maxed at 95%. No code changes recently. Load is [X req/s], normal baseline [Y req/s]. Need to scale resources or review load pattern."

---

## Summary: When to Use Each Runbook

| Alert                   | Runbook                     | Expected Resolution                 |
| ----------------------- | --------------------------- | ----------------------------------- |
| ServiceDown             | Runbook 1 (alert-triage.md) | Restart container, verify metrics   |
| HighErrorRate           | Runbook 2 (alert-triage.md) | Fix root cause (DB/code/dependency) |
| HighLatencyP95          | Runbook 3 (alert-triage.md) | Fix bottleneck (CPU/DB/network)     |
| Unsure or unknown alert | troubleshooting-guide.md    | Execute generic diagnostics first   |

**Follow this flow for every incident:**

```
Alert Fires
  ↓
Open incident-response.md (this document)
  ↓
Classify severity (Section 2)
  ↓
Choose appropriate runbook (Section 3)
  ↓
Execute runbook steps
  ↓
If resolved → Close (Section 5)
If not resolved after 10 min → Escalate (Section 4)
  ↓
Schedule postmortem (Section 6)
```
