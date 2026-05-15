# Phase 01 - Authentication & Token Validation

## Objective

Standardize and enforce authentication at API Gateway and service boundaries using Clerk-issued token validation, with predictable latency and zero credential leakage.

## Non-Goals

- Do NOT build custom identity provider or local password login.
- Do NOT embed authorization matrix logic in this phase.
- Do NOT add payment callback logic in this phase.
- Do NOT bypass gateway by trusting client-provided identity headers.

## Operational Semantics

- All protected requests must pass token verification before entering business handlers.
- Missing/expired/invalid token returns `401` with generic response body.
- Gateway injects trusted identity headers for downstream (`x-user-id`, `x-user-role`, `x-correlation-id`).
- Validation path target latency <=50ms p95 under normal key-cache hit.

## Scope

- Services affected:
  - `api-gateway`
  - all protected backend services consuming gateway identity headers
- Modules affected:
  - auth middleware/guard layer
  - Clerk key cache integration
- Infra/manifests affected:
  - none
- Configs affected:
  - Clerk JWKS cache TTL and issuer/audience settings

## Prerequisites

- `docs/architecture/TEAM_TASK_DIVISION.md` sections 2.0, 2.1
- `docs/architecture/add.md` Security quality attribute
- `docs/architecture/SAD/sad.md` security boundary decisions

## Tasks

- Implement gateway authentication middleware:
  - extract bearer token or session token
  - validate signature with cached Clerk keys
  - validate issuer/audience/expiry
  - populate trusted identity headers
- Implement defense-in-depth `AuthGuard` in services:
  - require gateway identity headers
  - validate user ID format and role enum membership
- Implement brute-force mitigation for login endpoints:
  - failed-attempt counters per account + IP in Redis
  - lock threshold 5 failures, lockout duration 5 minutes
  - Redis key structure: `brute:{accountId}:{ip}` with TTL = lockout duration
  - use sliding window counter (INCR + EXPIRE), NOT fixed-window
  - lockout response: `429 Too Many Requests` with `Retry-After` header (seconds)
  - successful login resets counter for that account+IP pair
  - counters expire automatically after lockout window (no manual cleanup)
- Remove sensitive auth logs (raw token, key material, claim dump)

## Expected Deliverables

- Gateway auth middleware and tests
- Shared auth guard for services and tests
- Redis-based brute-force limiter and tests
- Auth logging policy update

## Acceptance Criteria

- Protected endpoints reject invalid token with `401` and generic message.
- No logs contain raw JWT, refresh token, or key material.
- Brute-force lockout triggers on 6th failed login attempt.
- Lockout returns `429` with `Retry-After` header, NOT `401`.
- Counter resets on successful authentication.
- Redis key auto-expires after lockout window.
- Service-side guard rejects missing gateway identity headers with `403`.

## Validation Steps

- Unit tests for token parsing and claim validation.
- Integration tests for protected endpoints with valid/invalid/expired tokens.
- Latency measurement for token validation p95 <=50ms.

## Test Plan

- Unit: signature, expiry, issuer, audience, malformed token
- Unit: brute-force counter increment, threshold, lockout, reset-on-success, TTL expiry
- Integration: gateway -> service identity propagation
- Integration: 5 failed logins → 6th blocked → wait lockout → retry succeeds
- Failure simulation: stale keys then refresh

## Risks

- Incorrect trust boundary allowing forged identity headers.
- Key cache misconfiguration causing auth latency spikes.

## Rollback Strategy

- Revert auth middleware/guard changes.
- Restore prior gateway auth flow and key cache config.
- Re-run protected endpoint smoke tests.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.1
- SAD trust-boundary and identity delegation decisions

# Agent Implementation Prompt

Implement ONLY Phase 01.

FORBIDDEN:
- Custom auth provider or local credential database.
- Logging raw token/claims/secrets.
- Mixing RBAC ownership logic into this phase.
- Unbounded counters without TTL (memory leak vector).

Strict Rules:
1. Enforce token verification at gateway first, guard in services second.
2. Keep error responses generic; details only in secure server logs.
3. Add focused tests for token edge cases and brute-force lockout.
4. Do not touch payment or notification modules.
5. Brute-force limiter MUST use sliding window with auto-expiring Redis keys.
