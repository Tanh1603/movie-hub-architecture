# PostgreSQL Restore Runbook

## Scope

This runbook covers the four service-owned PostgreSQL databases used by the MovieHub platform:

- booking-service
- cinema-service
- movie-service
- user-service

The workflow is shell-first and uses `pg_dump -Fc`, `pg_restore`, and direct `psql` validation only.

## Backup Commands

The backup scripts write custom-format dumps into `backups/postgresql` by default.

All scripts execute PostgreSQL tooling through Docker containers, so host `pg_dump`, `pg_restore`, and `psql` are not required.

If your PowerShell `bash` command points to WSL, run scripts with Git Bash directly:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' 'scripts/postgresql-backup-restore/backup-booking.sh'
```

```bash
bash scripts/postgresql-backup-restore/backup-booking.sh
bash scripts/postgresql-backup-restore/backup-cinema.sh
bash scripts/postgresql-backup-restore/backup-movie.sh
bash scripts/postgresql-backup-restore/backup-user.sh
```

Container defaults used by scripts:

- `moviehub-postgres-booking` (`movie_hub_booking`)
- `moviehub-postgres-cinema` (`movie_hub_cinema`)
- `moviehub-postgres-movie` (`movie_hub_movie`)
- `moviehub-postgres-user` (`movie_hub_user`)

Override variables when needed:

- `POSTGRESQL_USER` (default `postgres`)
- `BOOKING_POSTGRES_CONTAINER`, `BOOKING_POSTGRES_DB`
- `CINEMA_POSTGRES_CONTAINER`, `CINEMA_POSTGRES_DB`
- `MOVIE_POSTGRES_CONTAINER`, `MOVIE_POSTGRES_DB`
- `USER_POSTGRES_CONTAINER`, `USER_POSTGRES_DB`

Optional overrides:

```bash
BACKUP_DIR=./backups/postgresql bash scripts/postgresql-backup-restore/backup-booking.sh
BOOKING_POSTGRES_CONTAINER=moviehub-postgres-booking BOOKING_POSTGRES_DB=movie_hub_booking bash scripts/postgresql-backup-restore/backup-booking.sh
```

## Restore Commands

The ordered restore script always restores in this sequence:

1. booking-service
2. cinema-service
3. movie-service
4. user-service

```bash
bash scripts/postgresql-backup-restore/restore-all.sh
```

PowerShell equivalent (Git Bash executable):

```powershell
& 'C:\Program Files\Git\bin\bash.exe' 'scripts/postgresql-backup-restore/restore-all.sh'
```

If you need to restore from specific dump files, point the script at explicit archives:

```bash
BOOKING_DUMP=./backups/postgresql/booking-service-20260512T120000.dump \
CINEMA_DUMP=./backups/postgresql/cinema-service-20260512T120000.dump \
MOVIE_DUMP=./backups/postgresql/movie-service-20260512T120000.dump \
USER_DUMP=./backups/postgresql/user-service-20260512T120000.dump \
bash scripts/postgresql-backup-restore/restore-all.sh
```

The restore script exits on the first failure. If booking restore fails, cinema, movie, and user are not attempted.

## Validation Commands

Run the matching validation script after each restore step or after a full environment restore:

```bash
bash scripts/postgresql-backup-restore/validate-booking-restore.sh
bash scripts/postgresql-backup-restore/validate-cinema-restore.sh
bash scripts/postgresql-backup-restore/validate-movie-restore.sh
bash scripts/postgresql-backup-restore/validate-user-restore.sh
```

PowerShell equivalent (Git Bash executable):

```powershell
& 'C:\Program Files\Git\bin\bash.exe' 'scripts/postgresql-backup-restore/validate-booking-restore.sh'
```

Validation checks are direct SQL only. They verify schema presence, critical tables, row counts, and lightweight consistency rules.

## Corruption Recovery

If a database is corrupted or a restore fails, stop the restore process immediately, identify the failing dump, and re-run from a known-good archive.

Operational sequence:

1. Stop the restore command if it is still running.
2. Confirm the latest backup archive is intact.
3. Re-run the relevant backup or restore command.
4. Re-run the matching validation script.

If the archive itself is corrupted, generate a new backup from the source database before attempting restore again.

## Partial Restore

For a single database restore, set only the matching dump variable and restore that database in order with the other variables pointing at valid archives.

Example:

```bash
BOOKING_DUMP=./backups/postgresql/booking-service-20260512T120000.dump \
CINEMA_DUMP=./backups/postgresql/cinema-service-20260512T120000.dump \
MOVIE_DUMP=./backups/postgresql/movie-service-20260512T120000.dump \
USER_DUMP=./backups/postgresql/user-service-20260512T120000.dump \
bash scripts/postgresql-backup-restore/restore-all.sh
```

If only one service needs recovery, keep the other dump files pointed at the latest known-good archives so the restore order stays deterministic.

## Full Environment Recovery

Use this when all four databases need to be rebuilt from backup:

1. Restore booking-service.
2. Restore cinema-service.
3. Restore movie-service.
4. Restore user-service.
5. Run all four validation scripts.

If one validation fails, do not continue to later recovery steps until the failing database is fixed and validated.

## Rollback Notes

Restore is not automatically reversible. If a restore introduces bad data, roll back by restoring the previous dump archive for that database and validating again.

If a backup was taken immediately before a known-bad restore, prefer the last confirmed-good archive instead of the most recent one.

## WAL Restore Notes

WAL-based point-in-time recovery is documentation only in this phase.

The intended recovery model is:

1. Restore a clean base backup with `pg_restore`.
2. Reapply WAL only if a separate WAL archive and PITR process exists in the environment.
3. Validate the restored database with the matching SQL validation script.

This phase does not introduce WAL automation, orchestration, or platform-specific recovery tooling.

## Dry-Run Inspection

`pg_restore` runs inside containers in this phase. To review archive contents before restore, copy it into a container and list contents there:

```bash
docker cp ./backups/postgresql/booking-service-20260512T120000.dump moviehub-postgres-booking:/tmp/booking-inspect.dump
docker exec -it moviehub-postgres-booking pg_restore -l /tmp/booking-inspect.dump
docker exec -it moviehub-postgres-booking rm -f /tmp/booking-inspect.dump
```

Use that only for inspection. The actual recovery path still uses `pg_restore` against the target database.
