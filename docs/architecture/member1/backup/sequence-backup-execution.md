# Backup Service Sequences (Simplified)

This document captures three concise sequences for the simplified academic backup-service: scheduled backup, manual backup, and restore. Each sequence is step-by-step and omits enterprise-level concurrency and error matrixes.

## 1. Scheduled Backup (Preset)

1. Scheduler (NestJS scheduler) triggers according to a stored preset (EVERY_6_HOURS, DAILY, WEEKLY).
2. Service checks SQLite for an active backup; if none, it marks a new entry as IN_PROGRESS.
3. For each configured microservice, the service calls the corresponding shell script from `/app/scripts/postgresql/` (e.g. `backup-booking.sh`).
4. Script writes backup artifact to `/data/backups/postgresql/{backup-id}.dump` and exits with code 0 on success.
5. Service records metadata in SQLite: `backup_id`, `service`, `timestamp`, `status`, `duration`, `size`.
6. Scheduler finishes and the entry is updated to SUCCESS or FAILED.

Notes:

- The scheduler uses only the three presets mapped to fixed cron expressions; UI does not accept raw cron expressions.
- The implementation purposefully avoids distributed locks and complex coordination; the service runs as a single replica.

## 2. Manual Backup (On-Demand)

1. Administrator clicks the dashboard trigger or calls `POST /api/backups/trigger` with `{"service":"booking-service"}`.
2. Service checks SQLite for an active backup; if none, creates an IN_PROGRESS record with `triggered_by=manual`.
3. Service invokes the corresponding shell script and waits for its exit code.
4. On completion, the service updates the metadata record with status, duration, and file size and returns the backup ID to the caller.

Notes:

- If a backup is already in progress, the API returns HTTP 409 (conflict).

## 3. Restore (Manual)

1. Administrator selects a backup from the dashboard and issues `POST /api/backups/restore` with `service` and `backup_id`.
2. Service verifies the backup file exists under `/data/backups/postgresql/{backup-id}.dump` and records a restore entry in SQLite.
3. Service executes the appropriate `restore-{service}.sh` script from the scripts folder.
4. On script completion, the service records restore status and duration and returns success or failure to the UI.

Notes:

- Validation is optional and minimal (e.g., quick row count checks). The simplified system does not implement automatic rollback or multi-stage validation trees.

                                   - Table: Last 10 backups with status indicators
                                   - Health badge: backup_health_status
                                   - Summary: Total backups, failures, avg duration
                                   - Buttons: Manual backup trigger, restore form

T+8s Browser Display dashboard to operator
Show: "Last updated: 2026-05-16T14:35:10Z"

T+30s JavaScript (Browser) Auto-refresh interval expires
Repeat: Fetch /api/backups/history

T+31s Dashboard Service Query updated metadata
Return new backup entry if backup completed

T+32s JavaScript (Browser) Update table rows with new data
Animate new row entry (green highlight)
Update health badge if status changed

T+33s Browser Display updated dashboard
Show: "Last updated: 2026-05-16T14:35:40Z"

[Cycle repeats every 30 seconds]

```

---

## Key Execution Properties

| Property                   | Value                   | Notes                               |
| -------------------------- | ----------------------- | ----------------------------------- |
| **Backup Execution Time**  | ~30 seconds per service | Depends on DB size and network      |
| **Total Daily Backups**    | ~2 minutes (4 services) | 02:00 UTC scheduled start           |
| **Retention Cleanup**      | ~5-10 minutes           | Depends on # of old backups         |
| **Restore Time**           | ~60 seconds             | Depends on backup size              |
| **Mutex Lock Timeout**     | 5 minutes               | Prevent hung backup processes       |
| **API Response Time**      | <1 second               | Metadata queries; backup runs async |
| **Dashboard Refresh Rate** | 30 seconds              | JavaScript polling interval         |
| **Concurrency**            | 1 backup at a time      | Single mutex, no parallel backups   |

---

**Document Version:** 1.0
**Last Updated:** 2026-05-16
**Owner:** Infrastructure Team
```
