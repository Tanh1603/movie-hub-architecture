# Phase 10B - Metrics Instrumentation

## Objective

Implement Prometheus-compatible `/metrics` endpoints in all services and API Gateway so Prometheus can collect real metrics.

## Scope

- Add instrumentation with `prom-client` (or existing standard equivalent).
- Expose `/metrics` on health/metrics HTTP ports:
  - `api-gateway:3000`
  - `booking-service:3005`
  - `user-service:3006`
  - `movie-service:3007`
  - `cinema-service:3008`
- Include base metric sets:
  - HTTP request count, duration histogram, in-flight requests.
  - Process/runtime metrics from default collectors.
- Update Prometheus scrape configs from `/health/live` to `/metrics`.
- Keep boundary:

  - `3001-3004` = TCP microservice ports.
  - `3005-3008` = HTTP health/metrics ports.

- Do not use dynamic labels such as userId, email, bookingId, jwt, or raw URL params.

## Non-Goals

- Dashboard authoring and alert rule design (Phase 10C).
- Incident triage and runbook operations (Phase 10D).
- Business-domain custom KPIs unless explicitly needed for current SLOs.
- Distributed tracing stack rollout.

## Prerequisites

- Phase 10A completed and stable.
- Service health endpoints already functioning.
- Prometheus/Grafana containers running.

## Tasks / Implementation Steps

1. Add shared metrics module (`libs/shared-metrics` or equivalent reusable package).
2. Implement a common metrics registry and middleware/interceptor.
3. Expose `/metrics` endpoint in each service and API Gateway.
4. Ensure endpoint response is Prometheus text format.
5. Register default process/runtime metrics.
6. Update `infra/prometheus/prometheus.yml` scrape paths to `/metrics`.
7. Restart impacted services and Prometheus.

## Deliverables

- `/metrics` endpoint available in all five services.
- Shared instrumentation module and wiring in each app.
- Updated Prometheus config scraping `/metrics`.
- Basic metric naming and labels documented.

## Acceptance Criteria

- `curl` to each `/metrics` endpoint returns valid Prometheus text output.
- Prometheus target status transitions to `UP` for instrumented endpoints.
- Core HTTP and process metrics are visible in Prometheus expression browser.
- No dashboard or alert rule work introduced in this phase.

## Validation Steps

```bash
# Endpoint checks
curl -s http://localhost:3000/metrics | head
curl -s http://localhost:3005/metrics | head
curl -s http://localhost:3006/metrics | head
curl -s http://localhost:3007/metrics | head
curl -s http://localhost:3008/metrics | head

# Restart Prometheus after config updates
docker-compose restart prometheus

# Check targets and sample query
# http://localhost:9090/targets
# Query example: rate(http_requests_total[5m])
```

## Risks (short)

- Inconsistent metric names/labels across services.
- Missing endpoint wiring in one service causes partial observability.
- Cardinality growth from unbounded labels.

## Rollback (short)

1. Revert metrics module integration commits.
2. Restore Prometheus scrape path to `/health/live` temporarily.
3. Restart services and Prometheus.

## Agent Prompt / Notes

- Implement only instrumentation and scrape-path migration.
- Do not add dashboards/alerts/runbooks here.
- Keep metric labels bounded and consistent.
- Preserve alignment with ADD/SAD/TEAM_TASK_DIVISION observability attributes.
- Use consistent metric prefixes:
  moviehub_http_requests_total
  moviehub_http_request_duration_seconds
