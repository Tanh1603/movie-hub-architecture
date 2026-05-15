# Phase 10 - Security Regression Gates & Incident Runbooks

## Objective

Establish CI security regression gates with explicit critical/non-critical classification, and final incident runbooks for auth/payment/webhook security operations.

## Non-Goals

- Do NOT introduce new business features.
- Do NOT replace platform-wide incident process owned by SRE.
- Do NOT implement automated remediation (human-in-the-loop for all security incidents).

## Operational Semantics

- CI blocks merges on critical security regression failures.
- Non-critical gates produce warnings but do not block merges.
- Runbooks define deterministic triage and recovery actions for common incidents.
- Gate classification is explicit and documented — no ambiguity on what blocks vs warns.

## Scope

- Services affected:
  - all services impacted by Phases 01-09
- Modules affected:
  - CI pipelines
  - security regression test suites
  - incident documentation

## Prerequisites

- `phase-06-payment-state-reconciliation.md`
- `phase-09-security-observability-anomalies.md`
- TEAM_TASK_DIVISION P2

## Tasks

### CI Gate Classification

Define two tiers of gates with explicit blocking behavior:

**CRITICAL gates (MUST block merge to main):**
- Protected-route auth tests: every `@UseGuards(ClerkAuthGuard)` endpoint rejects unauthenticated requests
- RBAC role-based negative tests: unauthorized roles get `403`
- Ownership negative tests: cross-user access returns `404`
- Webhook signature verification tests: tampered payloads rejected
- Webhook timestamp freshness tests: stale callbacks rejected
- Payment state machine: terminal state immutability (no regression from COMPLETED → FAILED)
- Hardcoded secret scanning (`git-secrets` or `gitleaks`): fail on any detected credential in source
- Log redaction tests: no sensitive fields in log output samples

**NON-CRITICAL gates (warn only, do not block):**
- Brute-force lockout threshold tests (may need tuning)
- Notification outbox dedup tests (non-security-critical)
- Clerk sync reconciliation tests (degraded but not exploitable)
- Alert threshold validation tests (observability, not access control)

### CI Pipeline Integration

- Add security gate job(s) to existing CI workflow (GitHub Actions / Nx affected).
- Critical gates run on every PR targeting `main` and `release/*` branches.
- Non-critical gates run on every PR but report as warnings (annotations, not failures).
- Gate results are summarized in PR comment with pass/fail/warn counts.
- Required check: `security-gates-critical` must pass before merge.

### Incident Runbooks

Define runbooks with standard template for each scenario:

**Runbook template structure:**
```
# Runbook: <incident type>
## Trigger: <what alert/condition initiates this>
## Impact: <what is affected, blast radius>
## Diagnosis: <steps to confirm the incident>
## Containment: <immediate actions to limit damage>
## Recovery: <steps to restore normal operation>
## Post-mortem: <follow-up actions after resolution>
## Owner: <team/person responsible>
## Escalation: <path if owner cannot resolve within SLA>
## SLA: <target resolution time>
```

**Required runbooks:**
- **Auth outage / key rotation failure**: Clerk JWKS cache stale → all auth fails
  - Diagnosis: check `auth_failures_total` spike + Clerk status page
  - Containment: force JWKS cache refresh, extend token expiry temporarily
  - Recovery: verify Clerk connectivity, clear cache, re-validate sample tokens
  - SLA: P1, 15 minutes to containment
- **Webhook signature failure spike**: possible provider key rotation or attack
  - Diagnosis: check `webhook_signature_fail_total` by provider
  - Containment: verify provider webhook secret hasn't changed, check for replay patterns
  - Recovery: rotate webhook secret if compromised, acknowledge stuck callbacks manually
  - SLA: P1, 30 minutes to containment
- **Replay attack campaign**: sustained `webhook_replay_detected_total` spike
  - Diagnosis: analyze replay source IPs, check timestamp patterns
  - Containment: temporarily tighten timestamp tolerance, block suspicious IPs at WAF
  - Recovery: review and rotate affected webhook secrets
  - SLA: P1, 15 minutes to containment
- **Clerk sync drift backlog**: `clerk_sync_retry_exhausted_total` > 0
  - Diagnosis: check dead-letter queue size, Clerk API health
  - Containment: pause reconciliation job, prevent cascading failures
  - Recovery: drain dead-letter queue manually, restart reconciliation
  - SLA: P2, 4 hours to resolution
- **Brute-force attack surge**: `brute_force_lockouts_total` sustained spike
  - Diagnosis: check lockout distribution by IP range
  - Containment: add IP-based rate limiting at WAF/CDN level
  - Recovery: monitor lockout rate normalization, review locked accounts
  - SLA: P2, 1 hour to containment

### Release Checklist

Add mandatory security sign-off to release process:
- [ ] All critical CI security gates pass (green)
- [ ] Non-critical gates reviewed (warnings acknowledged with justification)
- [ ] Secret scanning clean (no hardcoded credentials)
- [ ] Runbooks reviewed and up-to-date for current implementation
- [ ] Alert baselines re-validated if security metrics changed
- [ ] Tabletop drill conducted within last 90 days

### Tabletop Drill Schedule

- Conduct quarterly tabletop drills using runbook steps.
- Rotate through scenarios: auth outage → webhook attack → replay → clerk drift.
- After each drill: update runbooks with any process gaps discovered.
- Track drill results in `docs/security/drill-log.md`.

## Expected Deliverables

- CI workflow updates with critical/non-critical gate classification
- security regression test suite (organized by gate tier)
- incident runbook docs (one file per scenario)
- release security checklist template
- tabletop drill schedule and log template

## Acceptance Criteria

- CI fails on seeded security regressions (critical gates).
- CI warns but does not fail on seeded non-critical regressions.
- Runbooks are executable and validated in tabletop drill.
- Release checklist includes mandatory security sign-off.
- Gate classification is documented and matches CI implementation.
- Every critical gate has at least one corresponding test case.

## Validation Steps

- Perform controlled regression injection in test branch:
  - remove `@UseGuards` from protected endpoint → CI must fail
  - add hardcoded secret to source → CI must fail
  - break webhook signature test → CI must fail
  - break notification dedup test → CI must warn, not fail
- Conduct tabletop incident drill using runbook steps (auth outage scenario).
- Verify PR comment summarizes gate results correctly.

## Test Plan

- CI integration tests for gating logic (critical blocks, non-critical warns)
- operational drill validation
- release checklist enforcement test

## Risks

- Overly strict gates slowing delivery without risk-based tuning.
- Stale runbooks diverging from implementation (mitigated by quarterly drill).
- Developers bypassing non-critical warnings without review.
- Gate classification disagreements between security and delivery teams.

## Rollback Strategy

- Temporarily downgrade **non-critical** gates to silent (log-only) if causing friction.
- **Critical gates MUST NEVER be downgraded** — if blocking, fix the regression instead.
- Keep critical auth/webhook/secret-scanning gates blocking at all times.
- If a critical gate has a false positive, fix the test, do not remove the gate.

## Architecture Alignment

- TEAM_TASK_DIVISION P2 closure and hardening

# Agent Implementation Prompt

Implement ONLY Phase 10.

FORBIDDEN:
- Marking critical security gates optional for main branch merges.
- Writing runbooks without concrete ownership and escalation path.
- Downgrading critical gates to warning tier without security team approval.
- Removing a gate instead of fixing the underlying test failure.

Strict Rules:
1. Keep critical-path security tests mandatory — they MUST block merge.
2. Non-critical gates warn only — they MUST NOT block merge.
3. Runbooks must map alerts → diagnosis → containment → recovery → post-mortem.
4. Update runbook docs whenever gate logic or alert thresholds change.
5. Tabletop drills must be conducted quarterly and results logged.
6. Release checklist is mandatory — no release without security sign-off.
