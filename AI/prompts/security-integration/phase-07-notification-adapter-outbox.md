# Phase 07 - Notification Adapter & Async Outbox Isolation

## Objective

Isolate notification provider failures from core transaction path using adapter abstraction and async outbox processing.

## Non-Goals

- Do NOT block booking confirmation on notification success.
- Do NOT merge notification retries into payment callback path.

## Operational Semantics

- Booking flow commits first, notification dispatch async later.
- Notification retry is bounded and independent from booking transaction.
- Failed notification enters triage queue; booking remains valid.

## Scope

- Services affected:
  - `booking-service`
  - notification worker service/module
- Modules affected:
  - notification adapter interface + providers
  - outbox consumer
  - retry/failure handling

## Prerequisites

- `phase-02-rbac-ownership-enforcement.md`
- TEAM_TASK_DIVISION 2.5

## Tasks

- Implement `NotificationAdapter` abstraction.
- Create async outbox event for booking-confirmed notifications.
- Add provider retry policy (3 attempts, 1s/2s/4s).
- Mark exhausted events for manual follow-up without business rollback.

## Expected Deliverables

- notification adapter module
- outbox worker integration
- retry + dead-letter handling tests

## Acceptance Criteria

- Booking confirmation API response is not delayed by notification provider outage.
- Retries are bounded and observable.
- Failed notification does not revert confirmed booking.

## Validation Steps

- Provider 503 simulation with eventual success.
- Provider hard-down simulation with dead-letter capture.

## Test Plan

- Unit: adapter response mapping
- Integration: outbox -> provider -> status update

## Risks

- Hidden coupling causing booking rollback on notification error.
- Duplicate notifications from retry race conditions.

## Rollback Strategy

- Disable async worker path.
- Revert adapter/outbox integration changes.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.5

# Agent Implementation Prompt

Implement ONLY Phase 07.

FORBIDDEN:
- Synchronous notification send inside booking transaction.
- Unlimited retries.

Strict Rules:
1. Outbox pattern must preserve at-least-once delivery with idempotent consumer behavior.
2. Notification failures are non-blocking for booking finalization.
3. Add tests for retry and dead-letter path.
