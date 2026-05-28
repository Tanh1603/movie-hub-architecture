# Phase 03 - Clerk Sync Reliability & Reconciliation

## Objective

Harden identity synchronization reliability between internal staff records and Clerk metadata using bounded retry and reconciliation jobs.

## Non-Goals

- Do NOT modify core RBAC semantics.
- Do NOT add payment or webhook processing logic.

## Operational Semantics

- Sync operations must be idempotent.
- Transient failures retry with bounded exponential backoff.
- Reconciliation scans detect and repair metadata drift.

## Scope

- Services affected:
  - `user-service`
  - `api-gateway` (if identity cache invalidation required)
- Modules affected:
  - Clerk adapter/repository
  - retry wrapper
  - reconciliation worker
- Configs affected:
  - retry budget and reconciliation schedule

## Prerequisites

- `phase-01-auth-token-validation.md`
- `phase-02-rbac-ownership-enforcement.md`
- TEAM_TASK_DIVISION P1 note + 2.1/2.2 dependencies

## Tasks

- Add idempotent sync command for staff role/cinema assignments.
- Add bounded retry policy for Clerk API failures (max 3 attempts: 1s/2s/4s).
- Implement reconciliation job:
  - compare internal canonical role data with Clerk metadata
  - **canonical source of truth: internal DB** — Clerk metadata is a projection
  - reconciliation direction: internal → Clerk (never Clerk → internal)
  - on conflict: overwrite Clerk metadata with internal value, emit `clerk_sync_drift_repaired` event
  - repair mismatches with before/after snapshot in audit log
  - log corrected records with actor=`system:reconciliation`, correlation ID, timestamp
- Add dead-letter handling for repeated sync failures.

## Expected Deliverables

- Clerk sync reliability module
- reconciliation worker job
- drift-report metrics and logs

## Acceptance Criteria

- Transient Clerk outage does not permanently break staff sync.
- Drift between internal and Clerk metadata is detected and corrected.
- Reconciliation always pushes internal → Clerk, never reverse.
- Every repair action produces audit entry with before/after values.
- Repeated failures are isolated for manual triage.

## Validation Steps

- Simulate Clerk 5xx/timeouts and verify retries.
- Seed metadata drift and verify reconciliation repair.

## Test Plan

- Unit: retry classifier and idempotency behavior
- Integration: sync + reconciliation end-to-end

## Risks

- Over-aggressive reconciliation overwriting valid updates.
- Retry storm under prolonged provider outage.

## Rollback Strategy

- Disable reconciliation job.
- Revert retry wrapper and sync mutation changes.
- Restore manual sync fallback SOP.

## Architecture Alignment

- TEAM_TASK_DIVISION P1 and 2.1/2.2 continuity

# Agent Implementation Prompt

Implement ONLY Phase 03.

FORBIDDEN:
- Unbounded retry loops.
- Blind full overwrite of Clerk metadata without canonical checks.
- Using Clerk metadata as source of truth for role assignments.
- Reconciliation repair without audit trail.

Strict Rules:
1. Idempotency key or deterministic sync key required.
2. Keep retries bounded and observable.
3. Failures beyond retry budget must be triaged, not ignored.
4. Reconciliation direction is always internal DB → Clerk. Never reverse.
5. Every repair must log before/after snapshot with correlation ID.
