References

- See `docs/architecture/member1/backup/backup-service-architecture.md` for the preset scheduling mapping and component notes.
- See `docs/architecture/member1/backup/sequence-backup-execution.md` for simple scheduled/manual sequences to implement.
- See `docs/architecture/member1/backup/backup-service-operations.md` and `backup-service-deployment.md` for operational and deployment examples.

Phase: 02 — Backup Scheduler & API

Objective

- Implement the scheduling and control API for preset-based backups, manual triggers, restores, and retention cleanup. Keep the API and scheduler minimal and deterministic.

Responsibilities

- Implement preset schedule support exposed via API/UI (preset values only):
  - `EVERY_6_HOURS` → `0 */6 * * *`
  - `DAILY` → `0 2 * * *`
  - `WEEKLY` → `0 2 * * 0`
- Scheduler should store only the preset key in SQLite (no raw cron strings in UI or DB).
- Implement REST endpoints:
  - `GET /api/schedule` — returns current preset key
  - `POST /api/schedule` — accepts `{ "preset": "EVERY_6_HOURS|DAILY|WEEKLY" }`
  - `POST /api/backups/trigger` — manual trigger (body: `{service}`)
  - `POST /api/backups/restore` — body: `{service, backup_id}`
  - `POST /api/backups/cleanup` — optional manual retention run (body `{dry_run}`)
  - `GET /api/backups/history` — recent backup records

Behavior & Constraints

- Scheduler is implemented inside the single NestJS process (e.g., `node-cron` or NestJS schedule module) and uses the preset→cron mapping internally.
- The database stores the preset key and the last run timestamp.
- Prevent concurrent backups via an in-process flag; return HTTP 409 if a backup is already running.
- On trigger, the service invokes the appropriate script and records results in SQLite.
- Runtime scripts live inside the backup-service image at `/app/scripts/postgresql/` and `/app/scripts/cleanup/`.
- Runtime writes are limited to `/data/backups`, `/data/restores`, and `/data/backup-service.db`.

Metrics (optional)

- Basic counters are acceptable (e.g., `backups_executed_total`, `backups_failed_total`) if implemented, but heavy metrics stacks are not required.

Do Not

- Do NOT add distributed locking, message queues, or advanced scheduling engines.
