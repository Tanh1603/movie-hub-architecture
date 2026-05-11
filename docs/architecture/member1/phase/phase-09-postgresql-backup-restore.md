# Phase 09 - PostgreSQL Backup, Restore, and Validation

## Objective

Muc tieu la xay dung quy trinh backup/restore PostgreSQL co the van hanh duoc, dung thu tu khoi phuc transaction core, va co script validation ro rang. Phase nay tap trung vao data reliability, khong tron voi monitoring hoac retry logic.

## Non-Goals

- Do NOT create centralized backup orchestration or management framework.
- Do NOT implement automatic failover or detection logic.
- Do NOT add backup encryption or advanced compression logic.
- Do NOT create custom restore scheduling; use existing cloud provider backup services where available.
- Do NOT add correlation IDs or synthetic tracing to backup/restore workflow.

## Operational Latency Budget

- Backup operation: complete within target SLA (15 min for booking, 60 min for others)
- Restore validation: complete within 5 minutes for consistency checks
- Post-restore readiness gate: health checks stable within 2 minutes

## Implementation Boundaries

Allowed:

- bash scripts
- simple Node.js validation scripts
- operational markdown runbooks
- local staging restore testing

Forbidden:

- backup platforms
- orchestration systems
- automatic failover
- cloud provisioning
- backup schedulers
- Kubernetes operators
- monitoring systems
- application code changes
- CI/CD redesign

## Scope

- Operational domains affected:

  - booking-service database
  - cinema-service database
  - movie-service database
  - user-service database

- Application code:

  - no functional changes allowed
  - no service runtime modification allowed

- Infrastructure affected:
  - PostgreSQL backup scripts
  - PostgreSQL restore scripts
  - restore validation scripts
  - operational runbook documentation

## Prerequisites

- Database access and environment secrets available in staging.
- Phase 03 completed (booking readiness health check available for post-restore gating).

## Tasks

- Create simple backup command examples for:

  - full PostgreSQL dump
  - restore from dump
  - WAL restore notes (documentation only)

- Create restore script:

  - sequential restore order:
    1. booking
    2. cinema
    3. movie
    4. user
  - stop immediately on failure
  - print clear operational logs

- Create lightweight validation script:

  - verify schema exists
  - verify critical tables exist
  - verify row count not zero
  - verify small booking/payment consistency sample

- Create concise operational runbook:

  - corruption scenario
  - partial restore scenario
  - full environment recovery scenario

- Keep all scripts procedural and simple.
- Prefer shell commands over abstractions.

## Expected Deliverables

- Scripts (new or updated):
  - `scripts/backup-*.sh` (or existing naming convention)
  - `scripts/restore-*.sh`
  - `scripts/validate-restore-*.sh` (or ts/js script if preferred by repo)
- Runbook docs:
  - `docs/architecture/member1/runbooks/postgresql-restore.md`
- Optional CI/staging job config to run restore validation drills.

## Acceptance Criteria

- Restore script executes databases in deterministic order.
- Validation script detects missing critical tables.
- Validation script detects zero-row critical datasets.
- Restore failure stops execution immediately.
- Runbook contains executable shell commands.
- No application service code modified.
- No backup orchestration framework introduced.

## Validation Steps

- Execute full staging restore drill from recent backup.
- Verify schema and critical count/consistency checks.
- Verify application readiness after restore before reopening traffic.

## Test Plan

- Unit tests:
  - parser/validator logic for consistency checks (if script is in TS/JS)
- Integration tests:
  - restore script dry-run mode
- Failure simulation tests:
  - inject broken snapshot metadata and verify validation fails
- Staging validation:
  - monthly full restore drill
- Operational validation:
  - capture RTO/RPO observations and corrective actions

## Risks

- Incomplete backup artifacts (snapshot without WAL continuity).
- Incorrect restore order causing temporary cross-service inconsistency.

## Rollback Strategy

- Revert new backup/restore automation scripts.
- Fall back to previously documented manual restore process.
- Keep validation scripts for diagnostics even if automation is rolled back.

## Architecture Alignment

- ADD:
  - 2.7.1 (consistency under concurrency)
  - 2.7.4 (compensation integrity)
- SAD:
  - 8.9 (backup and restoration)
  - 9 (ADR: service-per-database ownership)
- C4:
  - `c4-containers.md` (database ownership)
  - `c4-deployment.md` (data tier as failure zone)

# Agent Implementation Prompt

Implement ONLY Phase 09.

This is an OPERATIONS SCRIPT phase.
Do NOT build platforms or infrastructure systems.

STRICTLY FORBIDDEN:

- orchestration frameworks
- backup management systems
- cloud automation
- Kubernetes operators
- CI/CD redesign
- application code changes
- monitoring integrations
- distributed recovery systems

Implementation Requirements:

1. Create SIMPLE scripts only:

   - backup examples
   - restore script
   - validation script

2. Keep scripts procedural:

   - shell-first approach preferred
   - no framework abstractions
   - no class hierarchies

3. Restore order must be hardcoded:
   booking → cinema → movie → user

4. Validation checks only:

   - schema existence
   - critical tables existence
   - non-zero row counts
   - small consistency sample

5. Stop restore immediately on first failure.

6. Add operational logs using simple stdout printing.

7. Create concise markdown runbook with:

   - exact shell commands
   - rollback notes
   - validation commands

8. Do NOT modify application services.

Success Criteria:

- scripts executable manually
- restore process deterministic
- validation catches obvious corruption
- no platform engineering introduced
