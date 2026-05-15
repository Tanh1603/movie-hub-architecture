# Phase 05 - Webhook Signature & Replay Guard

## Objective

Secure payment callback entrypoint with signature verification, deduplication, and replay protection before any state mutation.

## Non-Goals

- Do NOT redesign payment initiation.
- Do NOT finalize long-tail reconciliation policies.

## Operational Semantics

- Untrusted callback payload must be validated first.
- Invalid signature never mutates business state.
- Duplicate callback must be acknowledged without reprocessing.

## Scope

- Services affected:
  - `booking-service` (webhook endpoint)
  - optional `api-gateway` route protection
- Modules affected:
  - webhook signature validator
  - replay/dedup store
  - callback audit logger

## Prerequisites

- `phase-04-payment-adapter-initiation.md`
- TEAM_TASK_DIVISION 2.4

## Tasks

- Add webhook endpoint per provider contract.
- Verify callback signature/HMAC with provider secret.
- Enforce **timestamp freshness check**:
  - reject callbacks with timestamp older than 5 minutes (`WEBHOOK_TIMESTAMP_TOLERANCE_MS=300000`)
  - extract timestamp from provider-specific header or payload field
  - compare against server clock with configurable tolerance
  - log rejected stale callbacks as `webhook_stale_rejected` security event
- Enforce dedup using provider transaction/event ID.
- Track replay attempts and suspicious callbacks.
- Return provider-safe ack response while suppressing internals.

## Expected Deliverables

- Webhook handler + signature middleware
- dedup persistence logic
- suspicious-callback audit entries

## Acceptance Criteria

- Invalid signature callbacks produce no state changes.
- Callbacks with timestamp older than tolerance window are rejected with `200` ack (no state change).
- Duplicate valid callbacks are acknowledged but not re-applied.
- Replay attempts are logged with security context.
- Validation order enforced: signature → timestamp freshness → dedup → state transition.

## Validation Steps

- Send valid callback once then duplicate.
- Send tampered payload/signature mismatch.
- Replay valid-signature callback with timestamp > 5 min old → must reject.
- Replay valid-signature callback with timestamp within window but duplicate ID → must dedup.
- Clock skew: callback timestamp 1s in future → must accept.

## Test Plan

- Unit: signature verify + dedup decision
- Integration: webhook process path
- Security negative tests: tampered and replayed payloads

## Risks

- Treating provider retries as replay attacks due to weak dedup keying.
- State mutation occurring before trust checks.

## Rollback Strategy

- Disable new webhook route/middleware.
- Restore prior callback path.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.4
- SAD callback trust boundary

# Agent Implementation Prompt

Implement ONLY Phase 05.

FORBIDDEN:
- Mutating payment/booking state before signature validation.
- Exposing validation failure details to callback caller.

Strict Rules:
1. Validation order: signature → timestamp freshness → dedup/replay → state transition.
2. Duplicate callbacks must be idempotent.
3. Security logs required for suspicious callback attempts.
4. Timestamp tolerance MUST be configurable via `ConfigService`, default 5 minutes.
5. Stale callbacks return `200` ack to provider (prevent retry storm) but perform no mutation.
