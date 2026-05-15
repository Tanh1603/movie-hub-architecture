# Implement replica-aware monitoring in Grafana for Docker Swarm services

Update the MovieHub observability stack to support replica-aware monitoring in Docker Swarm while preserving the existing service-level dashboards.

Context:

- Project uses Docker Swarm with replicated NestJS microservices.
- Current Prometheus config scrapes services through Swarm VIPs like:

  - booking-service:3005
  - user-service:3006

- This only provides service-level metrics and hides individual replicas/tasks.
- We now need replica/instance-level observability for HA, failover validation, and rollout monitoring.

Current infrastructure locations:

- infra/docker-stack.yml
- infra/prometheus/prometheus.yml
- infra/prometheus/rules/moviehub-phase-10c-alerts.yml
- infra/grafana/dashboards/\*.json
- infra/grafana/provisioning/dashboards/dashboards.yml
- infra/grafana/provisioning/datasources/datasource.yml

Current dashboards:

- moviehub-overview.json
- moviehub-api-gateway.json
- moviehub-booking-flow.json
- moviehub-user-service.json
- moviehub-movie-service.json
- moviehub-cinema-service.json

Goals:

1. Keep existing service-level metrics and dashboards.
2. Add replica-aware monitoring using Docker Swarm task discovery.
3. Extend existing dashboards instead of creating duplicate replica dashboards.
4. Ensure Grafana can visualize per-instance metrics when replicas > 1.

Required changes:

1. Update Prometheus scrape configuration

- Replace Swarm VIP targets like:

  - booking-service:3005

- With replica-aware task discovery:

  - tasks.booking-service:3005

- Use dns_sd_configs for Swarm task discovery where appropriate.
- Preserve all existing job names if possible to avoid breaking dashboards.
- Ensure Prometheus can scrape every replica independently.

2. Update Grafana dashboards
   For each service dashboard:

- Keep existing aggregate/service-level panels.
- Add a new section named:

  - "Replica Health"
  - or "Instance Metrics"

Add panels such as:

- Replica availability:

  - up{job="..."}

- Request rate by instance:

  - rate(moviehub_http_requests_total[5m]) by (instance)

- p95 latency by instance
- In-flight requests by instance
- Any other meaningful replica-aware metrics.

Important:

- Do NOT create 5 new dashboards just for replicas.
- Extend the existing dashboards instead.
- Existing overview UX should remain clean and readable.

3. Dashboard behavior

- Aggregate panels should continue using sum(...) queries.
- Replica-level panels must use by(instance).
- Grafana should automatically display one line per replica/task.

4. Swarm compatibility

- Ensure the configuration works with:

  - docker stack deploy
  - replicated services
  - Swarm internal DNS

- Maintain compatibility with infra/docker-stack.yml.

5. Validation
   After changes:

- Prometheus should discover all replicas individually.
- Grafana should show separate instance series when replicas = 2.
- Failover tests using killed replicas should visibly affect only one instance line, not the whole service.

6. Non-goals

- Do not migrate to Kubernetes.
- Do not redesign the entire monitoring stack.
- Do not remove current service-level dashboards.
- Do not add unnecessary dashboards.

Deliverables:

- Updated prometheus.yml
- Updated Grafana dashboard JSON files
- Any required updates to docker-stack.yml
- Brief explanation/comments documenting how replica-aware monitoring now works in Swarm.

# Review and Refactor

Refactor the Grafana service dashboards to properly support Docker Swarm replica-aware monitoring without showing misleading duplicate "service VIP" instances.

Files to update:

- infra/grafana/dashboards/moviehub-api-gateway.json
- infra/grafana/dashboards/moviehub-booking-flow.json
- infra/grafana/dashboards/moviehub-cinema-service.json
- infra/grafana/dashboards/moviehub-movie-service.json
- infra/grafana/dashboards/moviehub-user-service.json

Current issue:

- Prometheus now scrapes both:

  - Swarm service VIPs (e.g. api-gateway:3000)
  - Swarm task replicas (e.g. 10.0.x.x:3000)

- Replica-aware Grafana panels currently display:

  - 1 VIP endpoint
  - - N replica endpoints

- This creates misleading visuals like:

  - 1 / 1 / 1
  - appearing as 3 instances when only 2 replicas actually exist.

Goal:

- Replica-level panels must ONLY show real task replicas.
- Service-level panels must remain aggregate-only.
- Dashboard UX should look production-grade and avoid confusion.

Required changes:

1. Service Health panel
   Current query:

```promql
up{job="..."}
```

Replace with an aggregate summary query.

Use:

```promql
count(up{job="..."} == 1)
```

Requirements:

- Show only one aggregate stat.
- Do not display multiple "1" values.
- Title remains:

  - "Service Health"

Optional:

- Configure thresholds so:

  - green when replicas >= expected minimum
  - red when replicas drop.

2. Replica Health panel
   Keep replica-aware visibility but EXCLUDE Swarm VIP endpoints.

Current issue:

- Panels include:

  - api-gateway:3000
  - booking-service:3005

- Those are VIP/load-balancer endpoints and must not appear as replicas.

Update replica-aware queries to filter out service VIP names.

Use patterns similar to:

```promql
up{
  job="api-gateway-metrics",
  instance!~"api-gateway.*"
}
```

or equivalent filtering logic.

Requirements:

- Only real task/container instances should appear.
- Example:

  - 10.0.1.7:3000
  - 10.0.1.8:3000

- NOT:

  - api-gateway:3000

3. Replica-aware charts
   Update ALL instance-level charts to exclude VIP endpoints.

Affected panels include:

- Request Rate (by instance)
- p95 Latency (by instance)
- In-Flight Requests (by instance)

Apply filtering consistently.

Example:

```promql
rate(moviehub_http_requests_total{
  job="api-gateway-metrics",
  instance!~"api-gateway.*"
}[5m]) by (instance)
```

4. Keep aggregate panels unchanged
   Do NOT modify aggregate service-level panels such as:

- Request Rate
- Error Rate
- Overall p95 Latency
- Overall In-Flight Requests

These should continue using:

```promql
sum(...)
```

because they represent service-level aggregation across replicas.

5. Dashboard UX improvements
   Maintain clean layout:

- Overview section
- Aggregate service metrics
- Replica/instance metrics section

Ensure:

- Legends use:

```json
"legendFormat": "{{instance}}"
```

- Replica panels clearly indicate:

  - "(by instance)"

6. Consistency
   Apply the same observability structure consistently across all 5 dashboards.

7. Validation expectations
   After update:

- If replicas = 2:

  - Replica panels should show exactly 2 instance series.

- Service Health should show:

  - 2
  - not 1 / 1 / 1

- Aggregate charts should continue functioning normally.
- Failover tests should visibly affect only the failed replica series.

Do not:

- Create new dashboards
- Remove existing aggregate panels
- Break existing Prometheus job names
- Redesign dashboard themes/layouts unnecessarily
