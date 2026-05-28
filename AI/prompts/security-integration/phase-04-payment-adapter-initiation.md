# Phase 04 - Payment Adapter & Secure Initiation

## Objective

Introduce provider-agnostic payment adapter flow with secure initiation, idempotency, and strict secret handling.

## Non-Goals

- Do NOT implement webhook replay handling here.
- Do NOT implement notification dispatch.

## Operational Semantics

- Every payment initiation request must be idempotent by booking context.
- Provider requests must use bounded timeout (<=30s).
- Secrets are loaded from secure runtime configuration only.

## Scope

- Services affected:
  - `booking-service` (payment orchestration)
  - `api-gateway` (request forwarding/rate policy)
- Modules affected:
  - payment adapter interface
  - provider implementation (e.g., VNPay)
  - idempotency store
- Configs affected:
  - payment provider secrets and callback URL

## Prerequisites

- `phase-01-auth-token-validation.md`
- TEAM_TASK_DIVISION 2.3

## Tasks

- Define canonical `PaymentAdapter` interface.
- Implement initiation flow:
  - generate/store idempotency key
  - short-circuit duplicate requests
  - invoke provider with timeout and trace context
- Store only safe payment metadata (status, transaction ID, amount, timestamp).
- Add initiation failure classification and generic error responses.

## Expected Deliverables

- Payment adapter contract and provider implementation
- idempotent payment initiation service
- tests for duplicate initiation handling

## Acceptance Criteria

- Duplicate initiation returns same canonical result.
- No card data/CVV/PIN stored internally.
- Provider timeout/failure does not crash booking flow.

## Validation Steps

- Repeat same booking payment initiation and verify idempotent response.
- Rotate secret and verify runtime reload path.

## Test Plan

- Unit: adapter mapping and idempotency behavior
- Integration: booking -> payment initiation
- Failure: provider timeout and 5xx responses

## Risks

- Incorrect idempotency key scope causing accidental collisions.
- Leaking provider secrets in error logs.

## Rollback Strategy

- Revert adapter/integration commits.
- Restore existing provider call path.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.3
- SAD external provider isolation rule

# Agent Implementation Prompt

Implement ONLY Phase 04.

FORBIDDEN:
- Webhook dedup or replay logic in this phase.
- Persisting sensitive payment payload details.

Strict Rules:
1. Adapter boundary must isolate provider-specific fields.
2. Idempotency required for every initiation.
3. Errors to clients remain generic.
