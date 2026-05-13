# Phase 10 - Security Regression Gates & Incident Runbooks

## Objective

Establish CI security regression gates and final incident runbooks for auth/payment callback security operations.

## Non-Goals

- Do NOT introduce new business features.
- Do NOT replace platform-wide incident process owned by SRE.

## Operational Semantics

- CI blocks merges on critical security regression failures.
- Runbooks define deterministic triage and recovery actions for common incidents.

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

- Add CI gates:
  - protected-route auth tests
  - RBAC/ownership negative tests
  - webhook signature/replay tests
  - sensitive-log leakage checks
- Define incident runbooks:
  - auth outage / key rotation failure
  - webhook signature failure spike
  - replay attack campaign
  - clerk sync drift backlog
- Add release checklist requiring green security gates.

## Expected Deliverables

- CI workflow updates and required checks
- security regression suite
- incident runbook docs with escalation matrix

## Acceptance Criteria

- CI fails on seeded security regressions.
- Runbooks are executable and validated in tabletop drill.
- Release checklist includes mandatory security sign-off.

## Validation Steps

- Perform controlled regression injection in test branch.
- Conduct tabletop incident drill using runbook steps.

## Test Plan

- CI integration tests for gating logic
- operational drill validation

## Risks

- Overly strict gates slowing delivery without risk-based tuning.
- Stale runbooks diverging from implementation.

## Rollback Strategy

- Temporarily downgrade non-critical gates to warning.
- Keep critical auth/webhook gates blocking until fixed.

## Architecture Alignment

- TEAM_TASK_DIVISION P2 closure and hardening

# Agent Implementation Prompt

Implement ONLY Phase 10.

FORBIDDEN:
- Marking security gates optional for main branch merges.
- Writing runbooks without concrete ownership and escalation path.

Strict Rules:
1. Keep critical-path security tests mandatory.
2. Runbooks must map alerts -> diagnosis -> containment -> recovery.
3. Update docs whenever gate logic changes.
