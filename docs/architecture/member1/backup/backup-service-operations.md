# Backup Service Operations Runbook

## Quick Reference

| Task                      | Command                                                                                                                              | Expected Output                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| **View last 10 backups**  | `curl http://backup-service:3000/api/backups/history?limit=10`                                                                       | JSON array of backup records   |
| **Trigger manual backup** | `curl -X POST http://backup-service:3000/api/backups/trigger -H "Content-Type: application/json" -d '{"service":"booking-service"}'` | Backup execution ID and status |
| **Check metrics**         | `curl http://backup-service:3000/metrics`                                                                                            | Prometheus text format metrics |
| **View dashboard**        | `http://backup-service:3000/dashboard`                                                                                               | HTML dashboard (browser)       |
| **Check service health**  | `curl http://backup-service:3000/health/live`                                                                                        | `{"status":"ok"}`              |
| **Get restore history**   | `curl http://backup-service:3000/api/restores/history?limit=5`                                                                       | JSON array of restore records  |

---

## 1. Manual Backup Execution

### Scenario: Perform backup before deployment

**Requirement:** Back up all services before deploying new code.

**Steps:**

1. **Verify backup-service is running:**

   ```bash
   docker service ls | grep backup-service
   docker service ps backup-service
   ```

   Expected: Service running on 1 replica

2. **Check if a backup is already in progress:**

   ```bash
   curl http://backup-service:3000/api/backups/status
   ```

   Expected output if idle:

   ```json
   {
     "in_progress": false,
     "last_backup_time": "2026-05-16T02:00:00Z",
     "last_status": "SUCCESS"
   }
   ```

3. **Trigger backup for all services:**

   ```bash
   for service in booking-service cinema-service movie-service user-service; do
     echo "Triggering backup for $service..."
     curl -X POST http://backup-service:3000/api/backups/trigger \
       -H "Content-Type: application/json" \
       -d "{\"service\":\"$service\", \"description\":\"Pre-deployment backup\"}"
   done
   ```

4. **Wait for backup to complete:**

   ```bash
   # Check status (repeat until status != IN_PROGRESS)
   curl http://backup-service:3000/api/backups/status
   ```

   Expected: All services complete in ~2-3 minutes

5. **Verify backup success:**

   ```bash
   curl http://backup-service:3000/api/backups/history?limit=4 | grep -o '"status":"SUCCESS"'
   ```

   Expected: 4 entries with `"status":"SUCCESS"`

6. **Proceed with deployment:**
   All backups confirmed; safe to deploy.

---

## 2. Cleanup Execution (Retention Policy)

### Scenario: Manually trigger retention cleanup

**Requirement:** Clean up backups older than retention period (default: 30 days).

**Background:** Cleanup runs automatically daily at 03:00 UTC, but can be triggered manually if needed.

**Steps:**

1. **Check current backup age distribution:**

   ```bash
   curl http://backup-service:3000/api/backups/retention-report
   ```

   Expected output:

   ```json
   {
     "total_backups": 347,
     "total_size_bytes": 347000000000,
     "backups_within_retention": 30,
     "backups_to_be_deleted": 317,
     "space_to_be_freed_bytes": 345000000000,
     "oldest_backup_date": "2026-02-16T02:00:00Z",
     "retention_days": 30
   }
   ```

2. **Execute cleanup manually:**

   ```bash
   curl -X POST http://backup-service:3000/api/backups/cleanup \
     -H "Content-Type: application/json" \
     -d '{"dry_run":false}'
   ```

   - Use `"dry_run":true` to preview without deleting

3. **Monitor cleanup progress:**

   ```bash
   # View cleanup logs in real-time
   docker service logs backup-service --follow --tail=50
   ```

4. **Verify cleanup completion:**

   ```bash
   curl http://backup-service:3000/api/backups/retention-report
   ```

   Expected: `backups_to_be_deleted` should be 0

5. **Validate volume space freed:**
   ```bash
   # Inside Swarm (or access backup volume directly)
   df -h /data/backups
   ```
   Expected: Free space increased by ~345 GB

---

## 3. Troubleshooting

### Issue: Backup Failure

**Symptom:** Backup status shows "FAILED" in dashboard

**Root Causes & Remediation:**

#### 3.1 PostgreSQL Connection Failed

```bash
# Verify PostgreSQL is reachable
docker exec -it postgres_container psql -U postgres -c "SELECT 1;"
```

**Actions:**

- Check PostgreSQL service status: `docker service ps postgres`
- Verify network connectivity: `docker exec backup-service ping postgres`

# Backup Service — Operations (Simplified)

This runbook explains the minimal operational steps for the lightweight academic backup-service.

## Quick Commands

- View recent backups: `curl http://backup-service:3000/api/backups/history?limit=10`
- Trigger manual backup: `curl -X POST http://backup-service:3000/api/backups/trigger -H "Content-Type: application/json" -d '{"service":"booking-service"}'`
- Trigger restore: `curl -X POST http://backup-service:3000/api/backups/restore -H "Content-Type: application/json" -d '{"service":"booking-service","backup_id":"20260516_020000"}'`
- Check health: `curl http://backup-service:3000/health/live`
- Start/Update (Docker Swarm): `docker stack deploy -c docker-stack.yml moviehub`

## Deployment Verification

- Check bundled scripts: `docker exec -it <container> ls -R /app/scripts`
- Check backup volume: `docker exec -it <container> ls -R /data/backups`
- Check restore workspace: `docker exec -it <container> ls -R /data/restores`
- Check backup-service logs: `docker service logs moviehub_backup-service`

## Start the Service

1. Ensure the image contains `/app/scripts/postgresql/` and `/app/scripts/cleanup/`.
2. Ensure volumes are created and mounted in `docker-stack.yml` for `/data/backups`, `/data/restores`, and `/data`.
3. Deploy the stack:

```bash
docker stack deploy -c docker-stack.yml moviehub
```

## Trigger a Manual Backup

1. Confirm no active backup: `curl http://backup-service:3000/api/backups/status`
2. Trigger backup for a service:

```bash
curl -X POST http://backup-service:3000/api/backups/trigger \
  -H "Content-Type: application/json" \
  -d '{"service":"booking-service"}'
```

3. Check history: `curl http://backup-service:3000/api/backups/history?limit=5`

## Restore from Backup

1. Pick a backup ID from the history.
2. Request a restore:

```bash
curl -X POST http://backup-service:3000/api/backups/restore \
  -H "Content-Type: application/json" \
  -d '{"service":"booking-service","backup_id":"<BACKUP_ID>"}'
```

3. Monitor response and check application readiness after restore.

## Retention Cleanup

- Retention runs automatically using the configured `BACKUP_RETENTION_DAYS`. A simple manual cleanup endpoint exists for operators: `POST /api/backups/cleanup` with `{"dry_run":true}` to preview or `{"dry_run":false}` to perform deletion.

## Common Troubleshooting (short)

- Script failures: run the relevant script inside the container to see errors: `docker exec backup-service /app/scripts/postgresql/backup-booking.sh`.
- Volume errors: verify mounts inside the container and permissions: `docker exec backup-service ls -la /data/backups`.
- Service not starting: check container logs `docker service logs backup-service --tail=200` and ensure the SQLite DB at `/data/backup-service.db` is writable.

## Notes for Students

- Keep the implementation simple and readable: prefer clear code over clever abstractions.
- Use SQLite only for metadata; treat backup files as the source of truth.
- Prometheus/Grafana are optional; keep metrics minimal if present.

**Document Version:** 1.0 — Simplified
**Actions:**
