# Alert Triage Runbooks

**Phase 10D Operational Observability**

## Overview

This document defines the triage workflow for MovieHub monitoring alerts. Each runbook follows: detect → classify → mitigate → escalate → close.

**Alert Ownership & Expected Recovery Times (ERTM):**

| Alert                  | Category     | Severity | Owner        | ERTM      | Escalation           |
| ---------------------- | ------------ | -------- | ------------ | --------- | -------------------- |
| MovieHubServiceDown    | Availability | Critical | On-Call Ops  | 5-15 min  | Platform Engineering |
| MovieHubHighErrorRate  | Reliability  | Warning  | Service Team | 15-30 min | Platform Engineering |
| MovieHubHighLatencyP95 | Performance  | Warning  | Service Team | 30-60 min | Database Team        |

---

## Runbook 1: MovieHubServiceDown (Critical)

### Alert Definition

- **Expression:** `up{job=~".*-metrics"} == 0`
- **For Duration:** 2 minutes
- **Severity:** Critical
- **Category:** Availability

### Symptoms

- Prometheus target shows `up=0` for a service metrics endpoint
- Grafana dashboard shows "no data" for affected service
- Service HTTP traffic may be degraded or unresponsive

### Quick Checks (< 2 minutes)

1. **Verify alert is real (not Prometheus scrape configuration issue):**

   ```bash
   curl -f http://localhost:9090/-/healthy
   curl -f http://localhost:9090/api/v1/targets | grep -i "down\|error"
   ```

2. **Check service container health:**

   ```bash
   docker compose ps | grep -E "booking-service|movie-service|cinema-service|user-service|api-gateway"
   docker compose logs --tail=50 <service-name>
   ```

3. **Check if service is responding to health probes:**

   ```bash
   # For booking-service:
   docker compose exec booking-service wget -qO- http://localhost:3005/health/live || echo "FAILED"

   # For api-gateway:
   curl.exe -f http://localhost:4000/api/health/live || echo "FAILED"

   # For movie-service:
   docker compose exec movie-service wget -qO- http://localhost:3007/health/live || echo "FAILED"

   # For cinema-service:
   docker compose exec cinema-service wget -qO- http://localhost:3008/health/live || echo "FAILED"

   # For user-service:
   docker compose exec user-service wget -qO- http://localhost:3006/health/live || echo "FAILED"
   ```

### Detailed Diagnostics (< 5 minutes)

1. **Inspect container logs for errors:**

   ```bash
   # Get last 200 lines and search for FATAL, ERROR
   docker compose logs --tail=200 <service-name> | grep -iE "FATAL|ERROR|PANIC|CRASH"
   ```

2. **Check database connectivity:**

   ```bash
   # Booking service uses postgres-booking on port 5438
   # User service uses postgres-user on port 5435
   # Movie service uses postgres-movie on port 5436
   # Cinema service uses postgres-cinema on port 5437

   docker compose exec postgres-booking pg_isready -U postgres
   docker compose exec postgres-user pg_isready -U postgres
   docker compose exec postgres-movie pg_isready -U postgres
   docker compose exec postgres-cinema pg_isready -U postgres
   ```

3. **Check Redis connectivity (if used):**

   ```bash
   docker compose exec redis redis-cli ping
   ```

4. **Verify /metrics endpoint is accessible:**
   ```bash
   # Prometheus scrapes each service's metrics endpoint
   # Check if the endpoint exists and returns Prometheus format
   docker compose exec booking-service wget -qO- http://localhost:3005/metrics | Select-Object -First 20
   curl.exe -f http://localhost:4000/metrics || echo "api-gateway metrics endpoint down"
   docker compose exec user-service wget -qO- http://localhost:3006/metrics | Select-Object -First 20
   docker compose exec movie-service wget -qO- http://localhost:3007/metrics | Select-Object -First 20
   docker compose exec cinema-service wget -qO- http://localhost:3008/metrics | Select-Object -First 20
   ```

### Mitigation Steps

**Option A: Service container crash or not starting**

1. Stop and remove affected service container:
   ```bash
   docker compose stop <service-name>
   docker compose rm -f <service-name>
   ```
2. Rebuild image to ensure latest code:
   ```bash
   docker compose build --no-cache <service-name>
   ```
3. Start service:
   ```bash
   docker compose up -d <service-name>
   ```
4. Wait 30 seconds for startup and database initialization.
5. Verify liveness probe passes:
   ```bash
   docker compose exec booking-service wget -qO- http://localhost:3005/health/live
   ```

**Option B: Database connection failure**

1. Verify database container is healthy:
   ```bash
   docker compose ps postgres-<service-db>
   docker compose logs --tail=50 postgres-<service-db>
   ```
2. If database is unhealthy, restart it:
   ```bash
   docker compose restart postgres-<service-db>
   ```
3. Wait 30 seconds for database to become ready.
4. Restart affected service:
   ```bash
   docker compose restart <service-name>
   ```

**Option C: /metrics endpoint returning wrong format**

1. Verify endpoint returns raw Prometheus text format (not JSON):
   ```bash
   docker compose exec booking-service wget -qO- http://localhost:3005/metrics | Select-Object -First 20
   # Should see lines like: `# HELP` and `# TYPE` and `moviehub_` metric names
   ```
2. If wrapped in JSON, check that TransformInterceptor excludes `/metrics` path.
3. Restart service after code fix:
   ```bash
   docker compose restart <service-name>
   ```

**Option D: Prometheus configuration issue**

1. Verify Prometheus config is valid:
   ```bash
   # If promtool available:
   promtool check config infra/prometheus/prometheus.yml
   ```
2. Check Prometheus logs:
   ```bash
   docker compose logs --tail=100 prometheus | grep -iE "error|config"
   ```
3. Restart Prometheus:
   ```bash
   docker compose restart prometheus
   ```

### Escalation Criteria

- **ESCALATE to Platform Engineering if:**
  - Service container will not start after rebuild (potential code defect)
  - Database persistence volume corrupted (data loss risk)
  - All services down simultaneously (infrastructure failure)
- **Expected escalation channel:** Slack #platform-ops, @platform-engineer-on-call

### Resolution Confirmation

Alert resolves automatically when:

1. Service container is running and healthy
2. `/metrics` endpoint responds successfully
3. Prometheus receives 2 consecutive successful scrapes
4. `up{job=~".*-metrics"} > 0` for > 2 minutes

**Manual verification:**

```bash
# Confirm alert fires in Prometheus
curl http://localhost:9090/api/v1/rules | grep MovieHubServiceDown

# Confirm alert is now inactive
curl http://localhost:9090/api/v1/alerts | grep -A 5 MovieHubServiceDown
```

---

## Runbook 2: MovieHubHighErrorRate (Warning)

### Alert Definition

- **Expression:** `(sum by (job) (rate(moviehub_http_requests_total{status=~"5.."}[5m])) / clamp_min(sum by (job) (rate(moviehub_http_requests_total[5m])), 1e-6)) > 0.05`
- **For Duration:** 10 minutes
- **Severity:** Warning
- **Category:** Reliability

### Symptoms

- Service returning > 5% HTTP 5xx responses for sustained period
- Error rate visible on service dashboard
- User-facing transaction failures (booking creation, movie search)

### Quick Checks (< 2 minutes)

1. **Verify alert by checking dashboard:**

   - Navigate to http://localhost:3009 → MovieHub dashboards
   - Look for service card with red "5xx Error Rate" panel
   - Confirm rate > 5%

2. **Check which service is affected:**

   ```bash
   curl.exe -s "http://localhost:9090/api/v1/query?query=rate(moviehub_http_requests_total{status=~'5..'}[5m])" | findstr /R '"job":"[^"]*"'
   ```

3. **Sample recent error responses:**
   ```bash
   # Get recent 5xx response logs
   docker compose logs --tail=100 <affected-service> | grep -iE "500|502|503|504|error"
   ```

### Detailed Diagnostics (< 10 minutes)

1. **Identify error root cause pattern:**

   ```bash
   # Check if errors are database-related
   docker compose logs --tail=200 <affected-service> | grep -iE "database|connection|timeout|deadlock"

   # Check if errors are resource-constrained
   docker compose logs --tail=200 <affected-service> | grep -iE "memory|heap|out of memory|ENOMEM"

   # Check if errors are dependency failures
   docker compose logs --tail=200 <affected-service> | grep -iE "failed to connect|unreachable|timeout"
   ```

2. **Check database health if service depends on DB:**

   ```bash
   # Get database connection pool stats (if instrumented)
   curl.exe -s http://localhost:<service-metrics-port>/metrics | findstr /I "pool connection"

   # Verify database is healthy
   docker compose exec postgres-<service-db> psql -U postgres -d movie_hub_<service> -c "SELECT 1;"
   ```

3. **Check for resource exhaustion:**

   ```bash
   # Check container resource usage
   docker stats --no-stream <affected-service>

   # Check running processes with a container-safe command
   docker compose exec <affected-service> ps
   ```

4. **Inspect the actual error responses:**

   ```bash
   # Create test request to see 5xx error
   curl.exe -v http://localhost:4000/api/movies 2>&1 | findstr /C:"< HTTP"

   # Check service logs from test time
   docker compose logs --since 1m <affected-service> | tail -50
   ```

### Mitigation Steps

**Option A: Transient spike (< 1% of requests failing)**

- This is often a normal operating condition.
- **No immediate action required** if error rate returns below 5% within 10 minutes.
- Monitor trend on dashboard.

**Option B: Database connection pool exhausted**

1. Verify connection pool status:
   ```bash
   curl -s http://localhost:<service-metrics-port>/metrics | grep -i pool
   ```
2. Restart the affected service to reset connection pool:
   ```bash
   docker compose restart <affected-service>
   ```
3. Monitor error rate dashboard for recovery.
4. If recurs, increase connection pool size in service .env file and redeploy.

**Option C: Dependency service unavailable (one service calling another)**

1. Identify which upstream service is failing:
   ```bash
   docker compose logs --tail=200 <affected-service> | grep -i "dependency\|upstream\|service unavailable"
   ```
2. Run Runbook 1 (ServiceDown) for the upstream service.
3. After upstream recovers, affected service should auto-recover.

**Option D: Code defect causing errors**

1. Check if there was a recent deployment:
   ```bash
   git log --oneline -10 apps/<affected-service>/src/
   ```
2. If recent change correlates with error spike, rollback:
   ```bash
   git revert <commit-hash>
   docker compose build --no-cache <affected-service>
   docker compose up -d <affected-service>
   ```
3. Monitor error rate for recovery (5-10 minutes).

### Escalation Criteria

- **ESCALATE to Service Team if:**
  - Error rate remains above 5% after 30 minutes of mitigation attempts
  - Pattern suggests data corruption or business logic defect
  - Database reports corruption or constraint violations
- **ESCALATE to Platform Engineering if:**
  - All services showing high error rate (infrastructure issue)
  - Database performance degraded

### Resolution Confirmation

Alert resolves automatically when:

1. 5xx error rate drops below 5%
2. Condition remains below threshold for > 10 minutes

**Manual verification:**

```bash
# Check current error rate
curl -s http://localhost:9090/api/v1/query?query='rate(moviehub_http_requests_total{status=~"5.."}[5m])'

# Confirm on dashboard
# http://localhost:3009 → service card → should show error rate < 5%
```

---

## Runbook 3: MovieHubHighLatencyP95 (Warning)

### Alert Definition

- **Expression:** `histogram_quantile(0.95, sum by (job, le) (rate(moviehub_http_request_duration_seconds_bucket[5m]))) > 2`
- **For Duration:** 10 minutes
- **Severity:** Warning
- **Category:** Performance

### Symptoms

- 95th percentile latency > 2 seconds for sustained period
- User-facing slow responses (booking creation takes > 2 seconds)
- Dashboard shows "P95 Latency" spike

### Quick Checks (< 2 minutes)

1. **Confirm alert via dashboard:**

   - Navigate to http://localhost:3009 → MovieHub dashboards
   - Look for "P95 Latency" panel, confirm > 2000ms

2. **Identify affected service:**

   ```bash
   curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,sum(rate(moviehub_http_request_duration_seconds_bucket[5m]))by(job,le))' | grep -o '"job":"[^"]*"'
   ```

3. **Verify it's not a query spike (legitimate burst):**

   ```bash
   # Check request throughput during latency spike
   curl -s http://localhost:9090/api/v1/query?query='rate(moviehub_http_requests_total[5m])by(job)' | grep -A 10 "job"

   # If throughput normal (< 100 req/s), likely a resource bottleneck
   # If throughput very high (> 1000 req/s), might be load-induced
   ```

### Detailed Diagnostics (< 10 minutes)

1. **Check if it's database query latency:**

   ```bash
   # Look for slow query logs
   docker compose logs --tail=200 <affected-service> | grep -iE "slow|took [0-9]+ms|query.*[0-9]{4}ms"
   ```

2. **Check service resource usage:**

   ```bash
   docker stats --no-stream <affected-service>
   # If CPU > 80% or memory > 80%, resource-constrained
   ```

3. **Check if downstream service is slow:**

   ```bash
   # E.g., if api-gateway has high latency, check upstream services
   curl -s http://localhost:9090/api/v1/query?query='rate(moviehub_http_request_duration_seconds_bucket[5m]){job=~"booking-service.*"}' | head -20
   ```

4. **Verify database performance:**

   ```bash
   docker compose exec postgres-<service-db> psql -U postgres -d movie_hub_<service> -c "SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 100 LIMIT 5;"
   ```

5. **Check network connectivity to Redis (if used for caching):**
   ```bash
   docker compose exec redis redis-cli ping
   ```

### Mitigation Steps

**Option A: Service CPU or memory exhaustion**

1. Check resource usage:
   ```bash
   docker stats --no-stream <affected-service>
   ```
2. If memory near limit:
   - Increase container memory limit in docker-compose.yml
   - Restart service: `docker compose up -d <affected-service>`
3. If CPU maxed out:
   - Check for infinite loops or blocking operations in logs
   - Restart service: `docker compose restart <affected-service>`
   - If recurs, escalate for code review

**Option B: Database connection latency**

1. Test database response time:
   ```bash
   docker compose exec postgres-<service-db> psql -U postgres -c "SELECT 1;"
   ```
2. If slow, check database resource usage:
   ```bash
   docker stats --no-stream postgres-<service-db>
   ```
3. Restart database if memory/CPU high:
   ```bash
   docker compose restart postgres-<service-db>
   ```

**Option C: Slow or missing index in database**

1. Identify slow queries:
   ```bash
   docker compose logs --tail=500 <affected-service> | grep -iE "duration|ms|slow" | tail -20
   ```
2. If query pattern identifiable, database team should add index.
3. Temporary mitigation: restart service to clear connection pool and retry.

**Option D: External API or service dependency slow**

1. Identify which service is called:
   ```bash
   docker compose logs --tail=200 <affected-service> | grep -iE "calling|request to|http.*[0-9]{4}ms"
   ```
2. Run diagnostics on that service (steps 1-4 above for that service).
3. May require coordination with that service's team.

### Escalation Criteria

- **ESCALATE to Database Team if:**
  - Database query latency consistently > 1000ms
  - Missing index suspected
  - Connection pool saturation
- **ESCALATE to Service Team if:**
  - Code defect causing inefficient algorithms
  - External API integration timing out
- **ESCALATE to Platform Engineering if:**
  - Infrastructure resource exhaustion
  - Network latency issues

### Resolution Confirmation

Alert resolves automatically when:

1. P95 latency drops below 2 seconds
2. Condition remains below threshold for > 10 minutes

**Manual verification:**

```bash
# Check current P95 latency
curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,sum(rate(moviehub_http_request_duration_seconds_bucket[5m]))by(job,le))'

# Confirm on dashboard
# http://localhost:3009 → check P95 Latency panel < 2000ms
```

---

## Triage Decision Tree

```
ALERT FIRED
  │
  ├─ ServiceDown (critical)
  │   └─ Follow Runbook 1: Is service container running?
  │       ├─ NO → Restart container (Option A/B)
  │       ├─ YES, but /metrics down → Fix /metrics endpoint (Option C)
  │       └─ YES, metrics up but up=0 → Prometheus issue (Option D)
  │
  ├─ HighErrorRate (warning)
  │   └─ Follow Runbook 2: Is error rate > 5%?
  │       ├─ Transient spike < 1% → Monitor, no action
  │       ├─ Connection pool exhausted → Restart service (Option B)
  │       ├─ Upstream service down → Fix that service first (Option C)
  │       └─ Code defect → Rollback recent change (Option D)
  │
  └─ HighLatencyP95 (warning)
      └─ Follow Runbook 3: Is P95 > 2 seconds?
          ├─ Resource exhaustion (CPU/Mem) → Scale or restart (Option A)
          ├─ Database latency → Check DB health (Option B/C)
          ├─ Slow query → Add index, escalate (Option C)
          └─ External dependency slow → Coordinate with team (Option D)
```

---

## Ownership Handoff

All runbooks assume **on-call responder** has SSH/Docker access.

**Handoff to escalation team:**

- Provide alert name, trigger time, and triage steps completed
- Include relevant log excerpts (last 100 lines of service logs)
- Include resource usage snapshot (`docker stats` output)
- Note if alert is recurring or first occurrence

**Follow-up:** Update this runbook after incident resolved (Document what was different, what helped, what hindered response).
