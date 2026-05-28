# Phase 02 - RBAC & Ownership Enforcement

## Objective

Apply deterministic role-based authorization and resource ownership checks on protected endpoints, especially admin/staff/customer boundaries.

## Non-Goals

- Do NOT alter authentication/token verification logic.
- Do NOT implement payment gateway logic.
- Do NOT redesign domain entities.

## Operational Semantics

- Role check failure returns `403` generic response.
- Ownership check failure returns `404` to avoid resource enumeration.
- Authorization checks must execute before mutable business actions.

## Scope

- Services affected:
  - `api-gateway` (routing policy)
  - `booking-service`, `user-service`, `movie-service`, `cinema-service`
- Modules affected:
  - role guard
  - endpoint policy metadata
  - ownership validators in service layer
- Configs affected:
  - role matrix definition

## Prerequisites

- `phase-01-auth-token-validation.md`
- TEAM_TASK_DIVISION 2.2

## Tasks

- Define role matrix for `CUSTOMER`, `STAFF`, `CINEMA_MANAGER`, `ADMIN`.
- Implement `RoleGuard` in services.
- Add ownership checks for user-scoped resources (bookings, tickets, refunds).
- Add authorization-failure audit logs with correlation ID.
- Harden high-risk admin endpoints explicitly listed in policy map.

## Expected Deliverables

- Role matrix document in repo
- Guard implementation + policy decorators/metadata
- Ownership check helpers + tests

## Acceptance Criteria

- Unauthorized role access returns `403`.
- Cross-user resource access returns `404`.
- Admin endpoints require correct elevated role.
- Audit logs record actor/action/target/outcome without sensitive payload.

## Validation Steps

- Endpoint matrix test per role.
- Ownership tests with same-user vs different-user IDs.
- Security regression checklist for protected routes.

## Test Plan

- Unit: role mapping and policy resolver
- Integration: role-based endpoint access
- Negative: missing role headers, tampered role claim

## Risks

- Policy drift across services.
- Inconsistent 403/404 behavior leaks resource existence.

## Rollback Strategy

- Revert role/ownership guard changes only.
- Restore prior endpoint policies.
- Re-run security smoke suite.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.2
- SAD service-boundary authorization rules

# Agent Implementation Prompt

Implement ONLY Phase 02.

FORBIDDEN:
- Editing token parsing or Clerk key lifecycle.
- Bypassing ownership checks in service methods.

Strict Rules:
1. Authorization must remain server-side, never UI-trust based.
2. Use explicit endpoint policy map, no implicit default-admin behavior.
3. Add tests covering role and ownership failures.
