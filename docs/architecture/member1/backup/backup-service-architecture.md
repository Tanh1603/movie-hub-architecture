# Backup Service Architecture

## Overview

The Backup Service is a lightweight, scheduled backup orchestration component that manages PostgreSQL database backups across all MovieHub microservices. It executes bundled container-local shell scripts, maintains backup metadata, and provides a minimal HTML dashboard for backup status visibility.

**Deployment Model:** Single Docker Swarm service (1 replica)  
**Runtime:** NestJS application with cron job scheduling  
**Storage:** Local volumes for backup artifacts and metadata

## Container-First Runtime Contract

- Scripts live inside the image at `/app/scripts/postgresql` and `/app/scripts/cleanup`.
- Backup artifacts are written only to `/data/backups`.
- Restore workspaces are written only to `/data/restores`.
- The service does not depend on monorepo-relative paths or host bind mounts for runtime scripts.

## Responsibilities

### Primary Responsibilities

| Responsibility            | Description                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| **Scheduled Backups**     | Execute PostgreSQL backups on a configurable schedule (default: daily at 02:00 UTC) |
| **Retention Management**  | Remove backups older than configured retention period (default: 30 days)            |
| **Restore Orchestration** | Coordinate database restore operations and validate restore integrity               |
| **Metrics Exposure**      | Export Prometheus metrics tracking backup success, duration, and retention status   |
| **Dashboard**             | Provide lightweight HTML dashboard showing recent backup history and status         |
| **Script Execution**      | Execute bundled shell scripts from `/app/scripts/`                                  |
| **Metadata Persistence**  | Store backup history metadata locally (backup timestamp, duration, status, size)    |

### Scope Exclusions

- Backup artifact storage (uses existing NFS or local Swarm volume)
- PostgreSQL administration (executes external scripts only)
- Authentication or authorization enforcement (runs as privileged Swarm service)
- Data validation beyond restore test execution

## Component Breakdown

### Core Components

```
backup-service/
├── src/
│   ├── main.ts                          # Service entry point
│   ├── app/
│   │   ├── app.controller.ts            # REST API endpoints
│   │   ├── app.service.ts               # Core business logic
│   │   ├── backup/
│   │   │   ├── backup.service.ts        # Backup orchestration
│   │   │   └── backup.module.ts         # Backup module
│   │   ├── metrics/
│   │   │   ├── metrics.service.ts       # Prometheus metrics collection
│   │   │   └── metrics.controller.ts    # GET /metrics endpoint
│   │   ├── scheduler/
│   │   │   ├── backup.scheduler.ts      # Cron job scheduling
│   │   │   └── retention.scheduler.ts   # Cleanup scheduling
│   │   ├── dashboard/
│   │   │   ├── dashboard.controller.ts  # HTML dashboard route
│   │   │   └── dashboard.service.ts     # Dashboard data aggregation
│   │   ├── restore/
│   │   │   ├── restore.service.ts       # Restore orchestration
│   │   │   └── validation.service.ts    # Restore validation
│   │   └── metadata/
│   │       ├── metadata.service.ts      # Metadata persistence
│   │       └── metadata.entity.ts       # Metadata data model
│   └── health/
│       └── health.controller.ts         # GET /health/live endpoint
├── prisma/
│   └── schema.prisma                    # SQLite schema for metadata
└── Dockerfile
```

### Data Flow

```
Scheduler (CronJob)
    ↓
Backup Service
    ├─→ Execute shell script
    │   └─→ PostgreSQL backup
    │       ↓
    │   Backup Volume (NFS/Local)
    │       ↓
    ├─→ Record metadata (SQLite)
    ├─→ Update metrics
    └─→ Alert on failure (Prometheus/Grafana)
```

## Runtime Flow

### Scheduled Backup Execution

1. **Scheduler Trigger** (02:00 UTC)

   - Cron job wakes backup scheduler
   - Verify no backup already in progress
   - Lock backup process (prevent concurrent backups)

2. **Backup Execution**

- Invoke shell script: `/app/scripts/postgresql/backup-{service}.sh`
- Script connects to PostgreSQL through the service database URL
- Backup file written to `/data/backups/postgresql/` volume

3. **Metadata Recording**

   - Query backup file size
   - Record start time, end time, status, size in local SQLite database
   - Update backup count and aggregate size metrics

4. **Metrics Export**

   - Increment `backup_total_executed_total` counter
   - Record `backup_last_executed_seconds` timestamp
   - Record `backup_duration_seconds` histogram
   - Record `backup_file_size_bytes` gauge
   - Set `backup_health_status` (1=healthy, 0=unhealthy)

5. **Retention Cleanup** (runs daily at 03:00 UTC)
   - Query all backups older than 30 days
   - Delete backup files from volume
   - Remove metadata entries
   - Record cleanup metrics

### Manual Backup Trigger

**API Endpoint:** `POST /api/backups/trigger`

```bash
curl -X POST http://backup-service:3000/api/backups/trigger \
  -H "Content-Type: application/json" \
  -d '{"service": "booking-service"}'
```

**Response:** Returns backup execution ID and status

### Restore Flow

**API Endpoint:** `POST /api/backups/restore`

```bash
curl -X POST http://backup-service:3000/api/backups/restore \
  -H "Content-Type: application/json" \
  -d '{"service": "booking-service", "backupId": "20260516_023000"}'
```

**Steps:**

1. Validate backup artifact exists
2. Invoke restore script
3. Run validation queries against restored database
4. Record restore metadata
5. Return success or failure

## Deployment Flow

### Pre-Deployment

- Backup shell scripts are bundled in the backup-service image under `/app/scripts/`
- Docker Swarm cluster is running
- Backup volume (NFS mount or local) is provisioned and mounted at `/data/backups`
- Restore workspace volume is provisioned and mounted at `/data/restores`
- PostgreSQL credentials injected as environment variables

### Service Stack Definition

```yaml
services:
  backup-service:
    image: movie-hub/backup-service:latest
    ports:
      - '3001:3000' # REST API
    environment:
      NODE_ENV: production
      DATABASE_URL: file:/data/backup-service.db
      BACKUP_SCRIPTS_PATH: /app/scripts
      BACKUP_ROOT: /data/backups
      RESTORE_ROOT: /data/restores
      BACKUP_RETENTION_DAYS: 30
      BACKUP_SCHEDULE: '0 2 * * *' # 02:00 UTC daily
      RETENTION_SCHEDULE: '0 3 * * *' # 03:00 UTC daily
      # PostgreSQL connection strings for each service
      BOOKING_SERVICE_DB_URL: postgres://...
      CINEMA_SERVICE_DB_URL: postgres://...
      MOVIE_SERVICE_DB_URL: postgres://...
      USER_SERVICE_DB_URL: postgres://...
      # Prometheus metrics
      METRICS_PORT: 3000
      METRICS_PATH: /metrics
    volumes:
      - backup-volume:/data/backups
      - restore-volume:/data/restores
      - backup-metadata:/data
    healthcheck:
      test: ['CMD', 'wget', '-q', '-O-', 'http://localhost:3000/health/live']
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      placement:
        constraints:
          - node.role != manager # Run on worker nodes only

volumes:
  backup-volume:
    driver: local
  backup-metadata:
    driver: local
```

## Prometheus Integration

### Metrics Endpoint

**Path:** `GET /metrics`

**Metrics Exported:**

```
# HELP backup_scheduled_total Total number of scheduled backups
# TYPE backup_scheduled_total counter
backup_scheduled_total{service="booking-service"} 45
backup_scheduled_total{service="cinema-service"} 45
backup_scheduled_total{service="movie-service"} 45
backup_scheduled_total{service="user-service"} 45

# HELP backup_failed_total Total number of failed backups
# TYPE backup_failed_total counter
backup_failed_total{service="booking-service"} 0

# HELP backup_duration_seconds Backup execution duration
# TYPE backup_duration_seconds histogram
backup_duration_seconds_bucket{service="booking-service",le="60"} 12
backup_duration_seconds_bucket{service="booking-service",le="120"} 44
backup_duration_seconds_bucket{service="booking-service",le="300"} 45

# HELP backup_file_size_bytes Latest backup file size
# TYPE backup_file_size_bytes gauge
backup_file_size_bytes{service="booking-service"} 1572864000

# HELP backup_last_executed_seconds Timestamp of last successful backup
# TYPE backup_last_executed_seconds gauge
backup_last_executed_seconds{service="booking-service"} 1715861400

# HELP backup_health_status Health status of backup service
# TYPE backup_health_status gauge
backup_health_status 1
```

### Prometheus Scrape Configuration

Add to `infra/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'backup-service-metrics'
    static_configs:
      - targets: ['backup-service:3000']
    metrics_path: '/metrics'
    scrape_interval: 60s
    scrape_timeout: 10s
```

### Grafana Dashboard Queries

Create dashboard panels using:

```promql
# Backup execution rate (per day)
increase(backup_scheduled_total[1d])

# Failed backups (per day)
increase(backup_failed_total[1d])

# Average backup duration (last 7 days)
avg_over_time(backup_duration_seconds_bucket{le="inf"}[7d])

# Latest backup size per service
backup_file_size_bytes
```

## Dashboard

### Lightweight HTML Dashboard

**Path:** `GET /dashboard`

**Features:**

- Last 10 backup entries (timestamp, service, status, duration, size)
- Backup health status indicator (green/red)
- Manual backup trigger button (modal form)
- Restore form (select service and backup ID)
- Live metrics summary (total backups, failures, avg duration)

**No Authentication:** Dashboard is accessible without authentication (runs inside Swarm network)

**Refresh:** Auto-refresh every 30 seconds

## Operational Considerations

### High Availability

- **Replica Count:** 1 (single instance)
- **Reason:** Backup scheduling requires exclusive execution (prevent duplicate backups)
- **Failover:** If backup-service pod crashes, Swarm restarts it automatically
- **Data Persistence:** Metadata stored in SQLite on persistent volume; metadata survives pod restarts

### Storage Requirements

| Component        | Volume          | Size   | Retention              |
| ---------------- | --------------- | ------ | ---------------------- |
| Backup artifacts | `/data/backups` | 100GB+ | 30 days (configurable) |
| Metadata         | `/data`         | 50MB   | Indefinite             |
| Logs             | Stdout          | N/A    | Swarm default          |

### Resource Constraints

- CPU: 0.25-0.5 cores (reserved-limit)
- Memory: 256MB-512MB (reserved-limit)
- Rationale: Backup execution runs asynchronously; service itself is lightweight

### Failure Modes

| Mode                   | Impact                                        | Recovery                                             |
| ---------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Shell script fails     | Backup not created; status recorded as failed | Manual trigger or next scheduled run                 |
| Volume full            | Backup incomplete; subsequent backups fail    | Cleanup retention policy or expand volume            |
| PostgreSQL unavailable | Script fails; backup status marked failed     | Database issue outside backup-service scope          |
| Metadata DB corrupted  | Backup history lost; service continues        | Rebuild from file system scan or restore from backup |

### Security

- **Network Access:** Runs inside Docker Swarm overlay network; no public ingress
- **Secrets:** PostgreSQL credentials injected via environment variables (managed by Swarm secrets)
- **Permissions:** No authentication required for dashboard or API (assumes internal network)
- **Script Execution:** Shell scripts run with service's user privileges (non-root recommended)

### Scaling Considerations

- **Horizontal Scaling:** NOT recommended (scheduling conflicts)
- **Vertical Scaling:** Increase CPU/memory if backup scripts perform slowly
- **Multi-Region:** Deploy separate backup-service per Docker Swarm cluster

## Integration Points

### Existing Artifacts

- **Shell Scripts:** `/app/scripts/postgresql/backup-*.sh` and `restore-*.sh`
- **Prometheus:** Scrapes `/metrics` endpoint
- **Grafana:** Queries Prometheus for backup metrics and dashboard visualization
- **Docker Swarm:** Service definition in `docker-stack.yml`

### External Dependencies

- PostgreSQL (for backup and restore operations)
- Docker Swarm (orchestration)
- Prometheus (metrics collection)
- Grafana (dashboard visualization)
- NFS or local volume (backup storage)

### Service Contracts

- **Backup Scripts:** Must return exit code 0 on success, non-zero on failure
- **PostgreSQL:** Must be accessible via connection string in environment variables
- **Volume Mounts:** Backup volume must be readable/writable; metadata volume must support SQLite

## Logging and Troubleshooting

### Log Locations

- **Container Logs:** `docker logs <backup-service-container>`
- **Backup Logs:** Inside backup scripts (if applicable)
- **Metadata:** SQLite database at `/data/backup-service.db`

### Debug Environment Variables

```yaml
BACKUP_SERVICE_LOG_LEVEL: debug # Enable verbose logging
BACKUP_SERVICE_DRY_RUN: true # Simulate backup without executing
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Infrastructure Team
