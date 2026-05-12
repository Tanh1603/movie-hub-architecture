# Phase 09.1 - Cron Backup Retention

## Objective

Add lightweight scheduled backup automation around the existing Phase 09 PostgreSQL scripts.

This phase does not change the backup architecture. It only adds cron-based execution examples, retention cleanup, and operational notes.

---

## Non-Goals

Do NOT implement:

- Kubernetes CronJobs
- Terraform schedulers
- backup orchestration platforms
- cloud automation frameworks
- CI/CD redesign
- monitoring systems
- application code changes
- distributed recovery systems
- backup architecture redesign

---

## Scope

Uses the existing Phase 09 PostgreSQL scripts:

- backup-booking.sh
- backup-cinema.sh
- backup-movie.sh
- backup-user.sh
- restore-all.sh
- validation scripts

Additional operational artifact:

- retention cleanup script for backup rotation

Optional documentation only:

- object-storage upload hook examples

---

## Implementation Tasks

### Cron Scheduling Examples

Provide simple daily cron examples for:

- booking database backup
- cinema database backup
- movie database backup
- user database backup

These cron entries must reuse the existing Phase 09 shell scripts.

### Retention Cleanup

Add shell-based cleanup that keeps backups for 7 days only.
Retention cleanup must execute only after all scheduled backups complete.

Requirements:

- remove older `.dump` backup files automatically
- shell-only implementation
- stdout logging

### Optional Upload Hooks

Document provider-neutral placeholder examples for object storage upload.

This is documentation only.

---

## Acceptance Criteria

- backups can run automatically via cron
- old backups are cleaned after 7 days
- no orchestration/platform engineering introduced
- restore and validation flow from Phase 09 remains unchanged
