# Security Release Checklist

**Release:** <!-- version / branch / PR -->  
**Date:** <!-- YYYY-MM-DD -->  
**Reviewer:** <!-- security sign-off owner -->

---

## Mandatory Pre-Release Gates

All items must be checked **before** merging to `main` or cutting a release tag.

### Critical CI Gates (must be GREEN)

- [ ] `security-gates-critical` job passed on latest commit
- [ ] Auth guard — unauthenticated requests rejected (`clerk-auth.guard.integration.spec.ts`)
- [ ] RBAC — unauthorized roles receive `403` (`authorization-policy.spec.ts`)
- [ ] Ownership — cross-user access returns `404` (`booking-ownership.spec.ts`)
- [ ] Webhook — tampered signatures rejected (`auth-webhook.controller.spec.ts`)
- [ ] Webhook — stale callbacks rejected (`webhook-replay-guard.spec`)
- [ ] Payment — terminal states are immutable (`payment.service.spec.ts`)
- [ ] Secret scanning — gitleaks returned no findings
- [ ] Log redaction — PII not in log output (`pii-crypto.service.spec.ts`)

### Non-Critical Gate Review

Document any warnings and justification for acknowledging them:

| Gate | Outcome | Justification |
|------|---------|---------------|
| Brute-force lockout tests | | |
| Notification outbox dedup | | |
| Clerk sync reconciliation | | |
| Alert threshold coverage | | |

---

## Secret Hygiene

- [ ] No new hardcoded secrets introduced (confirmed by gitleaks scan)
- [ ] All new env vars validated with Joi in `ConfigModule.forRoot`
- [ ] Secret rotation performed if any provider key was changed this release

---

## Observability Readiness

- [ ] Alert baselines re-validated if any security metrics changed
  - If yes: link to updated `docs/security/alert-baselines.md` section: <!-- link -->
- [ ] Grafana dashboard reviewed and panels updated if new metrics added
- [ ] All new alert rules in `infrastructure/prometheus/security.rules.yml`

---

## Runbook Currency

- [ ] Runbooks reviewed against current implementation (spot-check at least 2)
- [ ] No runbook references deprecated env vars or removed endpoints
- [ ] Last tabletop drill date: <!-- YYYY-MM-DD --> (must be within last 90 days)

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security reviewer | | | |
| Release owner | | | |

> **CRITICAL gates MUST NEVER be bypassed.** If a gate is failing, fix the regression — do not remove the gate.
