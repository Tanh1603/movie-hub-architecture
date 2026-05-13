# Phase 10A - Prometheus and Grafana Infrastructure Setup

## Objective

Deploy Prometheus and Grafana infrastructure in Docker Compose for observability foundation only.

## Scope

- Deploy and persist:
  - `prometheus` container (port 9090).
  - `grafana` container (host port 3009).
  - Persistent volumes for TSDB and dashboards.
- Configure temporary scrape jobs for infrastructure validation only:
  - `api-gateway:3000/health/live`
  - `booking-service:3005/health/live`
  - `user-service:3006/health/live`
  - `movie-service:3007/health/live`
  - `cinema-service:3008/health/live`
- Port boundary reminder:
  - `3001-3004` = TCP microservice ports.
  - `3005-3008` = HTTP health and future metrics ports.
- Keep service code unchanged.

## Non-Goals

- Implementing `/metrics` endpoints (Phase 10B).
- Adding `prom-client` or custom instrumentation (Phase 10B).
- Creating dashboards or alert rules (Phase 10C).
- Creating incident runbooks or triage workflows (Phase 10D).
- Adding tracing stack (OpenTelemetry, Jaeger, Tempo, Loki).

## Prerequisites

- Phases 01-09 completed.
- Docker Compose environment working locally or in staging.
- Existing service health endpoints reachable.

## Tasks / Implementation Steps

1. Add Prometheus and Grafana services to `docker-compose.yml`.
2. Add Prometheus config file under `infra/prometheus/prometheus.yml`.
3. Configure scrape jobs to `/health/live` endpoints listed above.
4. Add Grafana provisioning paths (datasource and dashboards folder).
5. Start services and verify both containers are healthy.
6. Verify Prometheus target discovery and data retention setup.

- Configure Prometheus retention via command flag:
  --storage.tsdb.retention.time=360h

## Deliverables

- Running `prometheus` and `grafana` containers.
- `infra/prometheus/prometheus.yml` with service scrape jobs.
- Grafana datasource provisioning for Prometheus.
- Updated phase docs reflecting 10A boundary.

## Acceptance Criteria

- Prometheus is reachable at `http://localhost:9090`.
- Grafana is reachable at `http://localhost:3009`.
- Prometheus target page lists all five service targets.
- Scrapes can show `DOWN` in Phase 10A due to non-Prometheus response format from `/health/live`; this is expected.
- No service application code changed.

## Validation Steps

```bash
# Start or refresh infra
docker-compose up -d prometheus grafana

# Check container state
docker-compose ps prometheus grafana

# Verify service health endpoints (example)
curl -f http://localhost:3000/health/live
curl -f http://localhost:3005/health/live

# Open Prometheus target page
# http://localhost:9090/targets
```

## Risks (short)

- Confusion about `DOWN` targets in 10A: expected until 10B adds `/metrics`.
- Disk growth from TSDB retention if retention is too high.
- Port conflicts on local machines.

## Rollback (short)

1. Stop observability containers: `docker-compose stop prometheus grafana`.
2. Remove Phase 10A config changes from compose/prometheus config.
3. Optionally remove volumes if full reset is required.

## Agent Prompt / Notes

- Implement infrastructure only; do not touch service code.
- Keep 10A -> 10B boundary strict.
- Keep alignment with ADD/SAD/TEAM_TASK_DIVISION observability responsibilities.
- Mount persistent named volumes:
  - prometheus-data
  - grafana-data
