# Phase 09A - PostgreSQL Backup, Restore, and Validation

## Objective

Implement simple operational PostgreSQL backup/restore procedures with deterministic restore order, lightweight validation scripts, and concise recovery runbooks.

This phase focuses only on data recovery reliability.

Restore order is fixed:

1. booking-service
2. cinema-service
3. movie-service
4. user-service

---

## Non-Goals

Do NOT implement:

- orchestration frameworks
- backup platforms
- automatic failover
- cloud automation
- Kubernetes operators
- monitoring integrations
- ORM/Prisma validation logic
- application code changes
- CI/CD redesign

---

## Backup Standard

All backups MUST use:

```bash
pg_dump -Fc
```

Requirements:

- custom dump format only
- restore via `pg_restore`
- no plain SQL dumps

---

## Operational Constraints

Allowed:

- bash scripts
- shell utilities
- Docker CLI (`docker exec`, `docker cp`)
- direct `psql` execution inside PostgreSQL containers
- `pg_dump` execution inside PostgreSQL containers
- `pg_restore` execution inside PostgreSQL containers
- lightweight validation scripts
- markdown runbooks

Forbidden:

- framework abstractions
- backup schedulers
- infrastructure systems
- Prisma Client usage
- service runtime modifications

---

## Scope

Databases:

- booking-service
- cinema-service
- movie-service
- user-service

Artifacts:

- backup scripts
- restore scripts
- validation scripts
- operational runbook

No application/service code changes allowed.

---

## Critical Validation Targets

### booking-service

Critical tables:

- `Bookings`
- `Payments`
- `Tickets`
- `Refunds`
- `BookingConcessions`
- `LoyaltyAccounts`
- `LoyaltyTransactions`

Validation:

- tables exist
- non-zero booking/payment data
- completed bookings must have related payments

Example consistency check:

```sql
SELECT COUNT(*)
FROM "Bookings" b
LEFT JOIN "Payments" p ON p.booking_id = b.id
WHERE b.payment_status = 'COMPLETED'
AND p.id IS NULL;
```

Expected result: `0`

---

### cinema-service

Critical tables:

- `Cinemas`
- `Halls`
- `Seats`
- `Showtimes`
- `SeatReservations`

Validation:

- non-zero cinema/hall data
- showtimes linked correctly

---

### movie-service

Critical tables:

- `movies`
- `movie_releases`
- `genres`
- `movie_genres`

Validation:

- non-zero movie data
- valid movie/genre references

---

### user-service

Critical tables:

- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `staffs`
- `settings`

Validation:

- roles/permissions exist
- user_roles non-empty
- settings accessible

---

## Tasks

### Backup Scripts

Create:

- `scripts/postgresql-backup-restore/backup-booking.sh`
- `scripts/postgresql-backup-restore/backup-cinema.sh`
- `scripts/postgresql-backup-restore/backup-movie.sh`
- `scripts/postgresql-backup-restore/backup-user.sh`

Requirements:

- use `pg_dump -Fc`
- timestamp filenames
- run PostgreSQL tools through Docker containers
- stop on failure
- print operational logs

---

### Restore Script

Create:

```text
scripts/postgresql-backup-restore/restore-all.sh
```

Requirements:

- hardcoded restore order:
  booking → cinema → movie → user
- use `pg_restore`
- run PostgreSQL tools through Docker containers
- stop immediately on failure
- validate dump existence
- print logs

---

### Validation Scripts

Create:

- `scripts/postgresql-backup-restore/validate-booking-restore.sh`
- `scripts/postgresql-backup-restore/validate-cinema-restore.sh`
- `scripts/postgresql-backup-restore/validate-movie-restore.sh`
- `scripts/postgresql-backup-restore/validate-user-restore.sh`

Requirements:

- direct SQL only
- no ORM/Prisma
- execute validation SQL through containerized `psql`
- fail immediately on validation error
- validate:

  - schema existence
  - critical tables
  - non-zero datasets
  - lightweight consistency checks

---

### Runbook

Create:

```text
docs/architecture/member1/runbooks/postgresql-restore.md
```

Must include:

- backup commands
- restore commands
- validation commands
- corruption recovery
- partial restore
- full environment recovery
- rollback notes
- WAL restore notes (documentation only)

Optional dry-run documentation only.

---

## Acceptance Criteria

- deterministic restore order enforced
- restore stops on first failure
- validation detects:

  - missing tables
  - empty critical datasets
  - broken consistency

- validation uses direct SQL only
- backup format locked to `pg_dump -Fc`
- PostgreSQL tooling runs via Docker containers
- no application code changes
- no orchestration/platform engineering introduced

---

# Agent Implementation Prompt

Implement ONLY Phase 09.

This is a SMALL operational scripting phase.

STRICTLY FORBIDDEN:

- orchestration frameworks
- backup platforms
- Kubernetes operators
- cloud automation
- monitoring systems
- ORM/Prisma validation logic
- CI/CD redesign
- application code changes

Implementation Requirements:

1. Create procedural PostgreSQL backup scripts using ONLY:

```bash
pg_dump -Fc
```

2. Create deterministic restore script with fixed order:

```text
booking → cinema → movie → user
```

3. Restore must:

- stop immediately on failure
- validate dump existence
- print operational logs
- run through Docker container PostgreSQL tools

4. Create lightweight validation scripts using direct SQL only.

Validation scope:

- schema existence
- critical table existence
- non-zero row counts
- lightweight consistency checks

5. No Prisma Client or ORM usage allowed.

6. Create concise operational runbook with executable shell commands.

7. WAL recovery notes are documentation-only.

8. Optional dry-run documentation only.
   Do NOT redesign CI/CD workflows.

Success Criteria:

- scripts executable manually
- deterministic restore workflow
- validation catches obvious corruption
- no platform engineering introduced
- no service runtime modifications
