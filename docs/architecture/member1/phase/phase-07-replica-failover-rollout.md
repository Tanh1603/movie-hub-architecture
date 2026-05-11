# Phase 07 - Replica, Failover, and Rollout Policy

## Objective

Muc tieu la chuan hoa chinh sach scale/failover/rolling update theo huong deployment hien tai (Docker Compose + cloud deployment scripts), dam bao dich vu user-facing co toi thieu 2 instance trong moi truong muc tieu, va rollback duoc nhanh neu loi.

## Non-Goals

- Do NOT introduce Kubernetes abstractions (PDB, HPA, etc.) unless already in use.
- Do NOT create new deployment pipelines or orchestration frameworks.
- Do NOT implement auto-scaling or dynamic replica adjustment.
- Do NOT create centralized rollout controller or deployment service.
- Do NOT invent new deployment abstractions or infrastructure.
- Do NOT implement service mesh or sidecar-based rollout control.
- Do NOT add correlation ID generation or observability instrumentation.
- Do NOT implement auto-healing or auto-remediation during rollout.

## Operational Semantics

- **Replica**: independent instance of service, each with own liveness/readiness probes.
- **Failover**: if one replica fails probe (2 consecutive failures), remove from traffic via deployment control.
- **Rollout**: update replicas one at a time, wait for new instance to pass liveness before updating next.
- **Rollout does NOT mean**: service is immediately ready for traffic (readiness gating happens at app level, not deployment level).
- **Health-driven**: rollout uses liveness probe signals to determine when replica is ready for next update.

## Scope

- Services affected:
  - `api-gateway`
  - `booking-service`
  - `user-service`
  - `movie-service`
  - `cinema-service`
- Modules affected:
  - none (runtime app code only if strictly required)
- Infra/manifests affected:
  - deployment pipeline/config scripts
  - infra deployment definitions currently used in repo
- Configs affected:
  - replica counts
  - rollout/rollback policy parameters
  - drain timeout if supported

## Prerequisites

- Phase 06 completed (graceful shutdown needed before safe rolling updates).
- Probe configuration stable from Phase 05.

## Tasks

- In current deployment config (Terraform, shell scripts, GitHub Actions workflow):
  - Set replica count to 2 for each of: api-gateway, booking-service, user-service, movie-service, cinema-service.
  - Configure rolling update: update 1 replica at a time, wait for health green before next replica.
  - Keep update order deterministic (gateway first, then services).
- Define rollback trigger:
  - if health probe fails for 2 consecutive checks, mark replica unhealthy.
  - if error rate exceeds threshold during rollout, pause and prompt manual review.
- Do NOT change application code or business logic.
- Document rollout procedure in one short runbook (one page, shell commands only).

## Expected Deliverables

- Updated deployment config files currently used by repo, for example:
  - `infra/terraform/...`
  - `.github/workflows/deploy.yml`
  - `scripts/manual-deploy.sh` (if rollout controls are script-driven)
- Operational note/runbook section for rollout and rollback.

## Acceptance Criteria

- Each of five services configured with replica count = 2 in staging/prod environments.
- Rolling update of one service completes without full service downtime (traffic continues on other replica).
- Rollback from failed revision completes within 10 minutes (manual or auto trigger).
- One replica failure is immediately detected (health probe catches it within 20s).
- One replica unhealthy does NOT make service unavailable to external traffic.

## Validation Steps

- Deploy one service revision with rolling strategy and observe traffic continuity.
- Simulate bad revision for one service and verify rollback flow.
- Kill one running instance and verify service stays available.

## Test Plan

- Unit tests:
  - none
- Integration tests:
  - deployment smoke checks post rollout
- Failure simulation tests:
  - forced unhealthy revision during rolling update
- Staging validation:
  - controlled failover drill under light traffic
- Operational validation:
  - capture failover and recovery timings

## Risks

- Capacity/resource limits causing rollout stalls.
- Incorrect rollback thresholds causing flapping.

## Rollback Strategy

- Revert deployment policy configuration only.
- Restore prior replica settings and rollout mode.
- Re-run stable release artifact.

## Architecture Alignment

- ADD:
  - 2.6.1, 2.6.3
  - 2.5.2 (zero-downtime updates)
- SAD:
  - 7.1, 7.3, 7.5
  - 10.1 (availability targets)
- C4:
  - `c4-deployment.md` (replicated gateway/services)

# Agent Implementation Prompt

Implement ONLY Phase 07: config-only changes to deployment infrastructure.

FORBIDDEN (blocks phase if violated):

- Introducing Kubernetes, service mesh, or new platform abstractions.
- Creating new deployment pipelines or orchestration frameworks.
- Implementing auto-scaling or dynamic replica adjustment logic.
- Creating centralized rollout controller or deployment service.
- Implementing auto-healing or auto-remediation during rollout.
- Adding correlation ID generation or observability instrumentation.
- Modifying application code or health probe behavior.

Strict Rules:

1. Inspect current deployment infrastructure (Terraform, shell scripts, GitHub Actions, Jenkins, Docker Compose).
2. For each service: set replica count to 2 (or min. 2 if higher is already required).
3. Configure rolling update policy: update 1 replica at a time, wait for liveness probe pass before next replica.
4. Keep update order deterministic: gateway first, then services.
5. Define rollback trigger: if liveness probe fails for 2 consecutive checks, mark replica unhealthy; if error rate spikes during rollout, pause and prompt manual review.
6. Do NOT introduce new orchestration, auto-scaling, or Kubernetes abstractions.
7. Do NOT modify application code, health probes, or graceful shutdown logic.
8. Document in 1-page operational runbook: pre-deploy checklist, update command, verification steps, rollback command.
9. Test: deploy a test change, observe rolling update, verify traffic continuity, verify rollback works.
10. Validation: all services can deploy with new replica/rollout policy, health probes drive update progression.
