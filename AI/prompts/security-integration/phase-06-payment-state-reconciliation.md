# Phase 06 - Payment State Machine & Reconciliation

## Objective

Enforce safe payment state transitions and background reconciliation for stuck or late payment events.

## Non-Goals

- Do NOT change auth/RBAC guard behavior.
- Do NOT add notification adapter concerns.

## Operational Semantics

- State transitions follow explicit allowed graph only.
- Out-of-order/late callbacks cannot regress final states.
- Reconciliation job resolves long-pending records safely.

## Scope

- Services affected:
  - `booking-service`
- Modules affected:
  - payment state machine
  - reconciliation scheduler/worker
  - transition audit logs

## Prerequisites

- `phase-04-payment-adapter-initiation.md`
- `phase-05-webhook-signature-replay-guard.md`
- TEAM_TASK_DIVISION 2.3 + 2.4

## Tasks

- Define allowed transitions (`PENDING -> SUCCESS|FAILED|EXPIRED`).
- Prevent terminal-state regression.
- Implement reconciliation for stale `PROCESSING/PENDING` records.
- Query provider for authoritative status when timeout threshold exceeded.
- Emit audit events for every transition decision.

## Expected Deliverables

- Payment transition policy implementation
- reconciliation worker and run schedule
- tests for late/out-of-order callbacks

## Acceptance Criteria

- Duplicate or late callbacks cannot corrupt confirmed bookings.
- Reconciliation updates stale payments deterministically.
- Transition logs are complete and traceable.

## Validation Steps

- Simulate success then late failure callback.
- Simulate missing callback then reconciliation success.

## Test Plan

- Unit: transition guard table
- Integration: callback + reconciliation interaction

## Risks

- Inconsistent state between booking and payment aggregates.
- Over-eager reconciliation causing false failures.

## Rollback Strategy

- Disable reconciliation job.
- Revert transition policy changes.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.3, 2.4

# Agent Implementation Prompt

Implement ONLY Phase 06.

FORBIDDEN:
- Implicit transitions not declared in transition map.
- Manual overrides without audit trail.

Strict Rules:
1. Terminal states are immutable unless explicit admin recovery workflow exists.
2. Reconciliation must be bounded and observable.
3. Keep booking/payment consistency checks explicit.
