# PostgreSQL Cron Backup Retention Runbook

## Scope

This runbook covers cron-based scheduling and retention cleanup for the existing PostgreSQL backup scripts from Phase 09.

It does not change the backup or restore design.

## Daily Backup Cron

The following examples run the existing backup scripts once per day.

Use Git Bash explicitly on Windows if `bash` resolves to WSL.

```cron
0 1 * * * cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && /c/Program\ Files/Git/bin/bash.exe scripts/postgresql-backup-restore/backup-booking.sh >> backups/postgresql/cron.log 2>&1
15 1 * * * cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && /c/Program\ Files/Git/bin/bash.exe scripts/postgresql-backup-restore/backup-cinema.sh >> backups/postgresql/cron.log 2>&1
30 1 * * * cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && /c/Program\ Files/Git/bin/bash.exe scripts/postgresql-backup-restore/backup-movie.sh >> backups/postgresql/cron.log 2>&1
45 1 * * * cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && /c/Program\ Files/Git/bin/bash.exe scripts/postgresql-backup-restore/backup-user.sh >> backups/postgresql/cron.log 2>&1
```

```bash
0 1 * * * cd /opt/movie-hub && bash scripts/postgresql-backup-restore/backup-booking.sh >> backups/postgresql/cron.log 2>&1
15 1 * * * cd /opt/movie-hub && bash scripts/postgresql-backup-restore/backup-cinema.sh >> backups/postgresql/cron.log 2>&1
30 1 * * * cd /opt/movie-hub && bash scripts/postgresql-backup-restore/backup-movie.sh >> backups/postgresql/cron.log 2>&1
45 1 * * * cd /opt/movie-hub && bash scripts/postgresql-backup-restore/backup-user.sh >> backups/postgresql/cron.log 2>&1
```

If you run cron from Linux inside a container or VM, use the same shell scripts with the environment path adjusted for that host.

## Retention Cleanup

Keep backup files for 7 days only.

Run the cleanup script daily after backups complete:

```cron
0 3 * * * cd /d/VsCode/NestJS/TA\ Movie/movie-hub-architecture && /c/Program\ Files/Git/bin/bash.exe scripts/postgresql-backup-restore/backup-retention-cleanup.sh >> backups/postgresql/retention.log 2>&1
```

```bash
0 3 * * * cd /opt/movie-hub && bash scripts/postgresql-backup-restore/backup-retention-cleanup.sh >> backups/postgresql/retention.log 2>&1
```

Cleanup behavior:

- deletes `.dump` backup files older than 7 days
- logs each removed file to stdout
- leaves recent backups untouched

You can override the retention window:

```bash
RETENTION_DAYS=7 bash scripts/postgresql-backup-restore/backup-retention-cleanup.sh
```

## Restore From Retained Backup

Restore flow is unchanged from Phase 09.

If you need a retained archive, point `BOOKING_DUMP`, `CINEMA_DUMP`, `MOVIE_DUMP`, and `USER_DUMP` to the selected files and run the existing restore script.

Example:

```bash
BOOKING_DUMP=./backups/postgresql/booking-service-20260512T010000.dump \
CINEMA_DUMP=./backups/postgresql/cinema-service-20260512T011500.dump \
MOVIE_DUMP=./backups/postgresql/movie-service-20260512T013000.dump \
USER_DUMP=./backups/postgresql/user-service-20260512T014500.dump \
bash scripts/postgresql-backup-restore/restore-all.sh
```

## Operational Verification

Recommended checks after cron runs:

1. Confirm backup files were created in `backups/postgresql`.
2. Confirm retention logs show old files being removed after 7 days.
3. Run the Phase 09 restore script against a retained archive when validating recovery.
4. Run the Phase 09 validation scripts after restore.

## Object Storage Upload Hooks

Optional, provider-neutral placeholder example:

```bash
#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_PATH="$1"

echo "[upload] Preparing to upload ${ARCHIVE_PATH}"
# Replace this placeholder with your object storage CLI of choice.
echo "[upload] Upload hook not configured"
```

This is documentation only and is not part of the core retention implementation.
