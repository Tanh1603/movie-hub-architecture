# PostgreSQL Backup & Restore Scripts

Automated backup, restore, and retention management for PostgreSQL databases across all services.

## Quick Start

### Backup

```bash
# Backup individual service database
bash scripts/postgresql-backup-restore/backup-booking.sh
bash scripts/postgresql-backup-restore/backup-cinema.sh
bash scripts/postgresql-backup-restore/backup-movie.sh
bash scripts/postgresql-backup-restore/backup-user.sh

# All backups create `.dump` files in backups/postgresql/
```

### Restore

```bash
# Restore all services from latest backups (fixed order: booking → cinema → movie → user)
bash scripts/postgresql-backup-restore/restore-all.sh

# Or restore from specific dump files
BOOKING_DUMP=./backups/postgresql/booking-service-20260512T010000.dump \
CINEMA_DUMP=./backups/postgresql/cinema-service-20260512T011500.dump \
MOVIE_DUMP=./backups/postgresql/movie-service-20260512T013000.dump \
USER_DUMP=./backups/postgresql/user-service-20260512T014500.dump \
bash scripts/postgresql-backup-restore/restore-all.sh
```

### Validation

```bash
# Validate each restored database
bash scripts/postgresql-backup-restore/validate-booking-restore.sh
bash scripts/postgresql-backup-restore/validate-cinema-restore.sh
bash scripts/postgresql-backup-restore/validate-movie-restore.sh
bash scripts/postgresql-backup-restore/validate-user-restore.sh
```

### Retention & Cron

```bash
# Clean up backups older than 7 days
bash scripts/postgresql-backup-restore/backup-retention-cleanup.sh

# Auto-register cron jobs (Linux/container)
bash scripts/postgresql-backup-restore/setup-cron.sh --dry-run       # Preview cron entries
bash scripts/postgresql-backup-restore/setup-cron.sh --install       # Install cron jobs
bash scripts/postgresql-backup-restore/setup-cron.sh --uninstall     # Remove cron jobs

# On Windows: use --dry-run and configure manually in Task Scheduler
```

## Environment Variables

| Variable         | Default                                     | Usage                           |
| ---------------- | ------------------------------------------- | ------------------------------- |
| `BOOKING_DUMP`   | `backups/postgresql/booking-service-*.dump` | Restore: path to booking backup |
| `CINEMA_DUMP`    | `backups/postgresql/cinema-service-*.dump`  | Restore: path to cinema backup  |
| `MOVIE_DUMP`     | `backups/postgresql/movie-service-*.dump`   | Restore: path to movie backup   |
| `USER_DUMP`      | `backups/postgresql/user-service-*.dump`    | Restore: path to user backup    |
| `RETENTION_DAYS` | `7`                                         | Cleanup: days to keep backups   |

## Scripts

| Script                        | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `postgresql-common.sh`        | Shared helpers (logging, Docker checks, pg_dump/pg_restore wrappers) |
| `backup-booking.sh`           | Backup booking service database                                      |
| `backup-cinema.sh`            | Backup cinema service database                                       |
| `backup-movie.sh`             | Backup movie service database                                        |
| `backup-user.sh`              | Backup user service database                                         |
| `restore-all.sh`              | Restore all databases in fixed order                                 |
| `validate-*-restore.sh`       | Schema & data validation for each service                            |
| `backup-retention-cleanup.sh` | Delete `.dump` files older than 7 days                               |
| `setup-cron.sh`               | Automate cron job registration (Unix/Linux)                          |

## Container & Docker

All scripts run PostgreSQL tools inside Docker containers:

- `pg_dump` creates `.dump` files
- `pg_restore` restores from `.dump` files
- `psql` runs validation SQL

No host PostgreSQL tools required.

## Documentation

- **Phase 09**: [phase-09-postgresql-backup-restore.md](../../docs/architecture/member1/phase/phase-09-postgresql-backup-restore.md)
- **Phase 09.1**: [phase-09.1-cron-backup-retention.md](../../docs/architecture/member1/phase/phase-09.1-cron-backup-retention.md)
- **Restore Runbook**: [postgresql-restore.md](../../docs/architecture/member1/runbooks/postgresql-restore.md)
- **Cron Runbook**: [postgresql-cron-backup-retention.md](../../docs/architecture/member1/runbooks/postgresql-cron-backup-retention.md)

## Logs

- Cron backups: `backups/postgresql/cron.log`
- Cron retention cleanup: `backups/postgresql/retention.log`

## Cron Setup on Windows

Use Task Scheduler instead of crontab:

1. Generate cron entries:

   ```bash
   bash scripts/postgresql-backup-restore/setup-cron.sh --dry-run
   ```

2. Open Task Scheduler and create a new task for each entry

   - Action: `C:\Program Files\Git\bin\bash.exe`
   - Arguments: `-c "cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && bash scripts/postgresql-backup-restore/backup-booking.sh >> backups/postgresql/cron.log 2>&1"`
   - Trigger: Daily at 1:00 AM

3. Repeat for each backup script (cinema, movie, user) with different times

4. Create one more task for retention cleanup:
   - Time: Daily at 3:00 AM
   - Arguments: `-c "cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && bash scripts/postgresql-backup-restore/backup-retention-cleanup.sh >> backups/postgresql/retention.log 2>&1"`

Alternatively, run from WSL or a Linux container where `crontab` is available.

## Troubleshooting

**Windows + Git Bash:**

```bash
# If bash resolves to WSL instead of Git Bash:
& 'C:\Program Files\Git\bin\bash.exe' scripts/postgresql-backup-restore/backup-booking.sh
```

**Docker containers not running:**

```bash
# Ensure Docker Compose services are up
docker-compose up -d
```

**Restore fails with "database does not exist":**

```bash
# Run restore against running containers
docker-compose ps
bash scripts/postgresql-backup-restore/restore-all.sh
```

See [postgresql-restore.md](../../docs/architecture/member1/runbooks/postgresql-restore.md) for detailed troubleshooting.
