# Backup Service Deployment Guide

## Overview

This document describes the deployment process for the backup-service component in Docker Swarm. The backup-service runs as a single-replica service within the MovieHub stack.

---

## 1. Prerequisites

### 1.1 Infrastructure Requirements

- Docker Swarm cluster initialized and running
- At least one worker node available
- NFS mount or local volume provisioned for backup storage
- PostgreSQL services running and accessible
- Prometheus and Grafana running (for metrics collection)

### 1.2 Dependencies

- Docker images built and available (via registry or local)
- Environment variables and secrets configured
- Backup-service image contains runtime scripts under `/app/scripts`
- Volume mounts prepared for `/data/backups`, `/data/restores`, and `/data`

### 1.3 Verification Commands

```bash
# Verify Docker Swarm is running
docker info | grep Swarm

# Verify worker nodes available
docker node ls

# Verify volumes exist
docker volume ls | grep backup

# Verify PostgreSQL connectivity
docker exec postgres_container psql -U postgres -c "SELECT version();"
```

---

## 2. Docker Swarm Service Configuration

### 2.1 Complete Stack Definition

Create or update `docker-stack.yml` with the backup-service definition:

````yaml
version: '3.9'

services:
  # ... other services (api-gateway, booking-service, etc.) ...

  backup-service:
    image: movie-hub/backup-service:latest
    container_name: backup-service

    # Network
    networks:
      - moviehub-overlay

    # Port mappings (internal to Swarm only)
    ports:
      - target: 3000
        published: 3001
        protocol: tcp
        mode: host # Allow access from other containers

    # Environment variables
    environment:
      # Node environment
      NODE_ENV: production
      LOG_LEVEL: info

      # Database (backup-service metadata store)
      DATABASE_URL: file:/data/backup-service.db

      # Backup configuration
      BACKUP_SCRIPTS_PATH: /app/scripts
      BACKUP_ROOT: /data/backups
      RESTORE_ROOT: /data/restores
      BACKUP_RETENTION_DAYS: 30
      BACKUP_SCRIPT_TIMEOUT_SECONDS: 600 # 10 minutes max per script
      BACKUP_MUTEX_TIMEOUT_SECONDS: 300 # 5 minutes max lock duration

      # Scheduling (cron format)
      BACKUP_SCHEDULE: '0 2 * * *' # Daily at 02:00 UTC
      RETENTION_SCHEDULE: '0 3 * * *' # Daily at 03:00 UTC

      # Service database URLs (PostgreSQL connection strings)
      BOOKING_SERVICE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/booking_service?sslmode=disable
      CINEMA_SERVICE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/cinema_service?sslmode=disable
      MOVIE_SERVICE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/movie_service?sslmode=disable
      USER_SERVICE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/user_service?sslmode=disable

      # Metrics
      METRICS_PORT: 3000
      METRICS_PATH: /metrics
      METRICS_ENABLED: 'true'

      # Dashboard
      DASHBOARD_ENABLED: 'true'
      DASHBOARD_PATH: /dashboard
      DASHBOARD_AUTO_REFRESH_SECONDS: 30

      # Restore settings
      RESTORE_VALIDATION_ENABLED: 'true'
      RESTORE_VALIDATION_TIMEOUT_SECONDS: 300

    # Secrets (for sensitive data)
    secrets:
      - postgres_password # Used in DATABASE_URL above

    # Volume mounts
    volumes:
      # Backup artifacts
      - backup-volume:/data/backups:rw

      # Restore workspace
      - restore-volume:/data/restores:rw

      # Metadata persistence (SQLite database)
      - backup-metadata:/data:rw

      # Logs (optional, if collecting to host)
      - type: bind
        source: /var/log/moviehub/backup-service
        target: /app/logs
        read_only: false

    # Health check
    healthcheck:
      test: ['CMD', 'wget', '-q', '-O-', 'http://localhost:3006/health/live']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

    # Service deployment configuration
    deploy:
      # Replica settings
      replicas: 1 # IMPORTANT: Always 1 replica (single-instance scheduling)

      # Resource limits
      resources:
        limits:
          cpus: '0.5' # Maximum 0.5 CPU cores
          memory: 512M # Maximum 512 MB RAM
        reservations:
          cpus: '0.25' # Reserved 0.25 CPU cores
          memory: 256M # Reserved 256 MB RAM

      # Restart policy
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 5
        window: 120s

      ## Minimal Deployment Guide

      This page shows the minimal information required to deploy the simplified backup-service to a local Docker Swarm for an academic project.

      ### Required Volumes

      - `backup-volume` → mounted at `/data/backups` (store artifacts)
      - `backup-metadata` → mounted at `/data` (SQLite DB)
      - `restore-volume` → mounted at `/data/restores` (temporary restore workspace)

      ### Required Environment Variables

      - `DATABASE_URL=file:/data/backup-service.db`
      - `BACKUP_SCRIPTS_PATH=/app/scripts`
      - `BACKUP_ROOT=/data/backups`
      - `RESTORE_ROOT=/data/restores`
      - `BACKUP_RETENTION_DAYS` (integer, e.g. `30`)
      - Optional: `METRICS_ENABLED=true`

      ### Example docker-stack.yml snippet

      ```yaml
      services:
        backup-service:
          image: movie-hub/backup-service:latest
          ports:
            - '3001:3000'
          environment:
            - DATABASE_URL=file:/data/backup-service.db
            - BACKUP_SCRIPTS_PATH=/app/scripts
            - BACKUP_ROOT=/data/backups
            - RESTORE_ROOT=/data/restores
            - BACKUP_RETENTION_DAYS=30
          volumes:
            - backup-volume:/data/backups
            - restore-volume:/data/restores
            - backup-metadata:/data
          deploy:
            replicas: 1

      volumes:
        backup-volume:
          driver: local
        backup-metadata:
          driver: local
        restore-volume:
          driver: local
      ```

      ### Deploy / Update Commands

      ```bash
      docker stack deploy -c docker-stack.yml moviehub
      docker service update --force moviehub_backup-service
      ```

      ### Notes

      - Keep replica count at `1` to avoid concurrent execution complexity.
      - Prometheus/Grafana are optional; if enabled, expose `/metrics` and add a simple scrape job. Keep monitoring minimal for the academic use-case.
| `RESTORE_VALIDATION_ENABLED`    | `true`      | Validate restores before marking complete |

---

## 4. Volume Configuration

### 4.1 Backup Volume (Artifact Storage)

**Purpose:** Store backup artifact files (SQL dumps)
**Type:** NFS mount or local volume
**Size:** 120+ GB (see sizing in operations guide)
**Permissions:** Read/Write

**NFS Configuration Example:**

```bash
# On NFS server
mkdir -p /exports/backups
chmod 755 /exports/backups
echo "/exports/backups *(rw,sync,no_subtree_check)" >> /etc/exports
exportfs -a

# On Docker Swarm nodes
mkdir -p /mnt/backups
mount -t nfs 192.168.1.100:/exports/backups /mnt/backups
````

**Docker Volume Definition:**

```yaml
volumes:
  backup-volume:
    driver: local
    driver_opts:
      type: nfs
      o: 'addr=192.168.1.100,vers=4,soft,timeo=180'
      device: ':/exports/backups'
```

### 4.2 Metadata Volume (SQLite Database)

**Purpose:** Store backup history and metadata  
**Type:** Local or tmpfs  
**Size:** 50-100 MB  
**Permissions:** Read/Write

```yaml
volumes:
  backup-metadata:
    driver: local
```

---

## 5. Prometheus Integration

### 5.1 Scrape Configuration

Add to `infra/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'backup-service-metrics'
    static_configs:
      - targets: ['backup-service:3000']
    metrics_path: '/metrics'
    scrape_interval: 60s
    scrape_timeout: 10s
    relabel_configs:
      - source_labels: [__address__]
        regex: '([^:]+)(?::\d+)?'
        replacement: '${1}:3000'
        target_label: __address__
```

### 5.2 Alerting Rules

Create `infra/prometheus/backup-service-alerts.yml`:

```yaml
groups:
  - name: backup_service
    interval: 60s
    rules:
      - alert: BackupFailed
        expr: increase(backup_failed_total[1d]) > 0
        for: 1h
        labels:
          severity: critical
          service: backup-service
        annotations:
          summary: 'Backup failed in last 24 hours'
          description: '{{ $value }} backup(s) failed. Investigate immediately.'

      - alert: BackupScheduleMissed
        expr: time() - backup_last_executed_seconds > 86400 # 24 hours
        for: 30m
        labels:
          severity: warning
          service: backup-service
        annotations:
          summary: 'Scheduled backup missed'
          description: 'No successful backup in last 24 hours.'

      - alert: BackupStorageLow
        expr: (1 - (backup_storage_available_bytes / backup_storage_total_bytes)) > 0.85
        for: 1h
        labels:
          severity: warning
          service: backup-service
        annotations:
          summary: 'Backup storage > 85% utilized'
          description: 'Free backup storage: {{ humanize $value }}%'

      - alert: BackupHealthDown
        expr: backup_health_status == 0
        for: 5m
        labels:
          severity: warning
          service: backup-service
        annotations:
          summary: 'Backup service health check failing'
```

---

## 6. Deployment Commands

### 6.1 Initial Deployment

```bash
# Navigate to project root
cd /path/to/movie-hub-architecture

# Validate docker-compose/stack file
docker-compose config  # or
docker stack deploy --dry-run -c docker-stack.yml moviehub

# Deploy stack
docker stack deploy -c docker-stack.yml moviehub

# Verify service started
docker service ls | grep backup-service
docker service ps backup-service

# Wait for service to be healthy
watch 'docker service ps backup-service'  # Press Ctrl+C when healthy

# Verify logs
docker service logs backup-service --tail=50
```

### 6.2 Update Deployment

```bash
# Update image version in docker-stack.yml
# e.g., image: movie-hub/backup-service:v1.2.0

# Redeploy stack
docker stack deploy -c docker-stack.yml moviehub

# Monitor rollout
docker service ps backup-service --no-trunc

# Check logs during update
docker service logs backup-service --follow
```

### 6.3 Rollback Deployment

```bash
# Revert docker-stack.yml to previous version
git checkout HEAD~1 -- docker-stack.yml

# Redeploy with old version
docker stack deploy -c docker-stack.yml moviehub

# Verify rollback
docker service ps backup-service
docker service logs backup-service --tail=50
```

---

## 7. Configuration Management

### 7.1 Updating Backup Schedule

```bash
# Edit docker-stack.yml
# Change: BACKUP_SCHEDULE: "0 4 * * *"  # Change to 04:00 UTC

# Redeploy
docker stack deploy -c docker-stack.yml moviehub

# Verify update
docker service inspect backup-service | grep BACKUP_SCHEDULE
```

### 7.2 Updating Retention Policy

```bash
# Edit docker-stack.yml
# Change: BACKUP_RETENTION_DAYS: 45

# Redeploy
docker stack deploy -c docker-stack.yml moviehub

# Next cleanup will use new retention (3 hours after backup)
```

### 7.3 Updating Database Credentials

```bash
# Update secrets in Docker Swarm
docker secret rm postgres_password
echo "new_password_here" | docker secret create postgres_password -

# Force service update
docker service update --force backup-service

# Verify new credentials in use
docker service logs backup-service | grep -i connected
```

---

## 8. Operational Notes

### 8.1 Why Single Replica?

**Important:** Backup-service must run with exactly **1 replica** (not more, not less).

**Reasons:**

- **Scheduling conflicts:** Multiple replicas would execute backups simultaneously, creating duplicate backups
- **Exclusive lock model:** Backup execution requires a single owner for cron scheduling
- **Metadata consistency:** Single write source prevents race conditions in SQLite

**If High Availability Needed:**

- Use external scheduler (Kubernetes CronJob)
- Deploy backup-service as stateless API
- Move scheduling logic to dedicated scheduler service

### 8.2 Resource Allocation

| Resource        | Recommendation | Rationale                                    |
| --------------- | -------------- | -------------------------------------------- |
| CPU Limit       | 0.5 cores      | Backup execution is I/O-bound, not CPU-bound |
| CPU Reserved    | 0.25 cores     | Minimal baseline for NestJS runtime          |
| Memory Limit    | 512 MB         | Sufficient for Node.js + metadata DB         |
| Memory Reserved | 256 MB         | Safe baseline for production                 |

**If backups are slow:**

- Increase CPU limit to 1.0 cores
- Check PostgreSQL pg_dump performance
- Verify network bandwidth to backup storage

### 8.3 Scaling Considerations

| Scenario                  | Recommendation                                           |
| ------------------------- | -------------------------------------------------------- |
| Add new service to backup | Update `{SERVICE}_DB_URL` environment variable, redeploy |
| Increase retention        | Update `BACKUP_RETENTION_DAYS`, redeploy                 |
| Change backup time        | Update `BACKUP_SCHEDULE` cron expression, redeploy       |
| Move to different node    | Update placement constraints in `deploy.placement`       |
| High-availability backup  | Consider separate scheduler + stateless backup workers   |

### 8.4 Common Deployment Issues

**Issue:** Service fails to start with "address already in use"

```bash
# Check port conflicts
docker service ls
netstat -tulpn | grep 3001

# Solution: Change port in docker-stack.yml or stop conflicting service
```

**Issue:** Volumes not mounted correctly

```bash
# Verify volume exists
docker volume ls | grep backup

# Verify volume mount point
docker service inspect backup-service | jq '.Spec.TaskTemplate.ContainerSpec.Mounts'

# Recreate volume if needed
docker volume rm backup-volume
docker volume create backup-volume
```

**Issue:** Service restarts continuously

```bash
# Check logs for errors
docker service logs backup-service --tail=200

# Verify environment variables are set
docker service inspect backup-service | grep -A 50 Environment

# Check health check configuration
docker service inspect backup-service | jq '.Spec.TaskTemplate.ContainerSpec.HealthCheck'
```

---

## 9. Monitoring Deployment Health

### 9.1 Pre-Deployment Checks

```bash
#!/bin/bash
echo "Pre-deployment validation..."

# Check Docker Swarm status
if ! docker info | grep -q "Swarm: active"; then
  echo "ERROR: Docker Swarm not active"
  exit 1
fi

# Check volume availability
for vol in backup-volume backup-metadata backup-scripts; do
  if ! docker volume ls | grep -q $vol; then
    echo "ERROR: Volume $vol not found"
    exit 1
  fi
done

# Check PostgreSQL connectivity
for svc in booking cinema movie user; do
  if ! docker exec postgres_container psql -U postgres -c "SELECT 1" &>/dev/null; then
    echo "ERROR: Cannot connect to ${svc}_service database"
    exit 1
  fi
done

echo "All pre-deployment checks passed ✓"
```

### 9.2 Post-Deployment Verification

```bash
#!/bin/bash
echo "Post-deployment validation..."

# Wait for service to be ready
echo "Waiting for backup-service to be healthy..."
for i in {1..30}; do
  if docker exec backup-service wget -q -O- http://localhost:3000/health/live &>/dev/null; then
    echo "Service is healthy ✓"
    break
  fi
  sleep 2
done

# Verify metrics endpoint
echo "Checking metrics endpoint..."
if curl -s http://backup-service:3000/metrics | grep -q "backup_"; then
  echo "Metrics endpoint working ✓"
else
  echo "ERROR: Metrics endpoint not responding correctly"
  exit 1
fi

# Verify dashboard
echo "Checking dashboard..."
if curl -s http://backup-service:3000/dashboard | grep -q "<html>"; then
  echo "Dashboard available ✓"
else
  echo "ERROR: Dashboard not responding"
  exit 1
fi

echo "All post-deployment checks passed ✓"
```

---

## 10. Maintenance Windows

### 10.1 Planned Maintenance

```bash
# Stop backup-service temporarily
docker service update --replicas 0 backup-service

# Perform maintenance (e.g., volume expansion)
docker volume prune
docker volume create --opt size=200GB backup-volume

# Restart service
docker service update --replicas 1 backup-service

# Verify service recovered
docker service ps backup-service
```

### 10.2 Graceful Shutdown

```bash
# Service receives SIGTERM signal before termination
# Allow 30 seconds for graceful shutdown
docker service update --update-delay 30s backup-service

# Then drain and restart
docker service update --force backup-service
```

---

## 11. Security Considerations

### 11.1 Secrets Management

```bash
# Create secret for PostgreSQL password
echo "secure_password_123" | docker secret create postgres_password -

# Reference in service definition (already shown in stack above)

# Update secret (requires creating new secret and forcing service update)
docker secret rm postgres_password
echo "new_password_456" | docker secret create postgres_password -
docker service update --force backup-service
```

### 11.2 Network Security

- Backup-service runs on overlay network (internal to Swarm)
- No direct public ingress to metrics or dashboard
- Access only through API gateway or internal Swarm routing

### 11.3 Filesystem Permissions

```bash
# Backup scripts should not be world-writable
chmod 755 /app/scripts/postgresql/backup-*.sh

# Backup volume ownership
chown root:root /data/backups
chmod 755 /data/backups
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Infrastructure Team  
**Approved By:** DevOps Lead
