References

- See `docs/architecture/member1/backup/backup-service-architecture.md` for UI placement and minimal integration notes.
- See `docs/architecture/member1/backup/sequence-backup-execution.md` for the manual trigger and restore sequences the UI should call.
- See `docs/architecture/member1/backup/backup-service-operations.md` for quick API command examples to wire into the dashboard.

Phase: 03 — Dashboard Integration

Objective

- Provide a minimal, static admin dashboard that lets an operator view backup history, trigger manual backups, and initiate restores. Keep the UI plain HTML/CSS/JS and server-served; no frontend framework required.

Requirements

- Pages / UI elements:
  - History table showing recent backups (timestamp, service, status, size, duration)
  - Backup frequency selector (radio or dropdown) with presets: Every 6 hours, Daily, Weekly
  - Manual trigger buttons for each service
  - Restore modal: select a backup ID and confirm restore
  - Simple status cards: last backup time, last status
- The dashboard communicates with the API endpoints from Phase 02.
- The UI stores only preset keys; it must not accept raw cron expressions.

Design Constraints

- Keep layout minimal and readable; one-page app with small JS for API calls and DOM updates.
- No authentication implementation required — dashboard is for internal lab use only.
- No real-time websockets; periodic polling (e.g., refresh button or 30s interval) is acceptable.
- Dashboard assets must be served from the backup-service image itself; do not depend on a host workspace path.

Deliverable

- Static files placed under the NestJS `public` or `static` folder and served by the backup-service.
