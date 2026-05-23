References

- See `docs/architecture/member1/backup/backup-service-architecture.md` for the simplified architecture and component breakdown.
- See `docs/architecture/member1/backup/backup-service-operations.md` for operational runbook and common commands.
- See `docs/architecture/member1/backup/sequence-backup-execution.md` for simple sequences to model behavior.

Phase: 01 — Bootstrap Mini Backup Service

Objective

- Create a minimal NestJS `backup-service` that demonstrates core functionality for an academic project: invoke shell backup/restore scripts, persist simple metadata in SQLite, and serve a tiny static dashboard.

Run command in the root of the NestJS monorepo to generate the app:

```bash
npx nx g @nx/nest:app backup-service
```

Deliverables

- Minimal NestJS app with routes:
  - `GET /health/live`
  - `POST /api/backups/trigger` (body: {"service":"<name>"})
  - `GET /api/backups/history?limit=10`
  - `POST /api/backups/restore` (body: {"service":"<name>","backup_id":"<id>"})
  - Static `/dashboard` page (HTML/CSS/JS)
- SQLite initialization (file: `/data/backup-service.db`) with `backups` table (id, service, timestamp, status, duration_secs, size_bytes, triggered_by)
- Shell runner that calls bundled scripts under `/app/scripts/postgresql/` and `/app/scripts/cleanup/`
- Simple config via env vars: `DATABASE_URL`, `BACKUP_SCRIPTS_PATH`, `BACKUP_ROOT`, `RESTORE_ROOT`, `BACKUP_RETENTION_DAYS`

Constraints (Do Not)

- Do NOT add authentication, RBAC, message queues, distributed locks, or object storage.
- Do NOT expose raw cron-editing UI.
- Do NOT add enterprise logging/observability stacks.

Implementation notes

- Keep code and endpoints straightforward and well-documented for students.
- Use child_process spawn/exec carefully and log exit codes to SQLite.
- Treat `/app/scripts` as the only runtime script root and `/data` as the only writable filesystem root.
