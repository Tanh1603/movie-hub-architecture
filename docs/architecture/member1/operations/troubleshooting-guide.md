# Troubleshooting Command Guide

**Phase 10D Operational Observability - Command Reference**

This guide intentionally uses only commands that are available in the current Windows + Docker Compose environment or in the service images defined by the repo.

---

## 1. Compose and Container Status

```bash
docker compose config --services
docker compose ps
docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
docker stats --no-stream
docker stats --no-stream booking-service
docker compose restart <service-name>
docker compose up -d --build <service-name>
docker compose stop <service-name>
docker compose rm -f <service-name>
docker compose up -d <service-name>
```

---

## 2. Health and Metrics Checks

Use `curl.exe` on Windows so PowerShell does not substitute the `curl` alias.

```bash
curl.exe -f http://localhost:9090/-/healthy
curl.exe -f http://localhost:4000/api/health/live
docker compose exec booking-service wget -qO- http://localhost:3005/health/live
docker compose exec user-service wget -qO- http://localhost:3006/health/live
docker compose exec movie-service wget -qO- http://localhost:3007/health/live
docker compose exec cinema-service wget -qO- http://localhost:3008/health/live

curl.exe -s http://localhost:4000/metrics | Select-Object -First 20
docker compose exec booking-service wget -qO- http://localhost:3005/metrics | Select-Object -First 20
docker compose exec user-service wget -qO- http://localhost:3006/metrics | Select-Object -First 20
docker compose exec movie-service wget -qO- http://localhost:3007/metrics | Select-Object -First 20
docker compose exec cinema-service wget -qO- http://localhost:3008/metrics | Select-Object -First 20

docker compose exec booking-service wget -qO- http://localhost:3005/metrics | findstr /R "^# ^moviehub_"
```

---

## 3. Log Review

```bash
docker compose logs --tail=50 <service-name>
docker compose logs --tail=200 <service-name>
docker compose logs --since=10m <service-name>
docker compose logs -f <service-name>
docker compose logs --tail=100 prometheus
docker compose logs --tail=100 grafana
```

To search for error patterns, use PowerShell-friendly text search:

```bash
docker compose logs --tail=500 <service-name> | findstr /I "ERROR FATAL PANIC EXCEPTION 500 502 503 504"
```

---

## 4. Database Commands

```bash
docker compose ps postgres-booking
docker compose exec postgres-booking pg_isready -U postgres
docker compose exec postgres-user pg_isready -U postgres
docker compose exec postgres-movie pg_isready -U postgres
docker compose exec postgres-cinema pg_isready -U postgres

docker compose exec postgres-booking psql -U postgres -d movie_hub_booking -c "SELECT 1;"
docker compose exec postgres-user psql -U postgres -d movie_hub_user -c "SELECT 1;"
docker compose exec postgres-movie psql -U postgres -d movie_hub_movie -c "SELECT 1;"
docker compose exec postgres-cinema psql -U postgres -d movie_hub_cinema -c "SELECT 1;"

docker compose restart postgres-booking
docker compose restart postgres-user
docker compose restart postgres-movie
docker compose restart postgres-cinema
```

---

## 5. Redis Commands

```bash
docker compose ps redis
docker compose exec redis redis-cli ping
docker compose exec redis redis-cli info
docker compose exec redis redis-cli info memory
docker compose exec redis redis-cli dbsize
docker compose exec redis redis-cli slowlog get 10
docker compose exec redis redis-cli monitor
docker compose restart redis
```

---

## 6. Prometheus and Grafana

```bash
curl.exe -f http://localhost:9090/-/healthy
curl.exe -s http://localhost:9090/api/v1/alerts
curl.exe -s http://localhost:9090/api/v1/rules
curl.exe -s "http://localhost:9090/api/v1/query?query=up{job=~'.*-metrics'}"
curl.exe -s "http://localhost:9090/api/v1/query?query=rate(moviehub_http_requests_total{status=~'5..'}[5m])"
curl.exe -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(moviehub_http_request_duration_seconds_bucket[5m]))by(job,le))"

docker compose restart prometheus
curl.exe -f http://localhost:3009/api/health
curl.exe -s http://localhost:3009/api/search?type=dash-db
curl.exe -s http://localhost:3009/api/dashboards/db/moviehub-overview
docker compose restart grafana
```

Use browser links for dashboards when investigating by hand:

- `http://localhost:9090`
- `http://localhost:9090/alerts`
- `http://localhost:9090/rules`
- `http://localhost:9090/targets`
- `http://localhost:3009`

---

## 7. Service-to-Service Checks

Use the service health endpoints from inside a container to verify Compose DNS and network routing.

```bash
docker compose exec booking-service wget -qO- http://api-gateway:3000/api/health/live
docker compose exec api-gateway wget -qO- http://booking-service:3005/health/live
docker compose exec movie-service wget -qO- http://cinema-service:3008/health/live
docker compose exec cinema-service wget -qO- http://user-service:3006/health/live
```

For Redis, use the Redis client instead of raw port checks:

```bash
docker compose exec redis redis-cli ping
```

---

## 8. Resource and Disk Checks

```bash
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
docker system df
docker system df -v
docker inspect <container-id> --format '{{json .Mounts}}'
```

---

## 9. Incident Response Flow

```bash
docker compose logs --tail=200 <service-name> > service-logs.txt
docker stats --no-stream <service-name> > resource-stats.txt
curl.exe -s http://localhost:9090/api/v1/alerts > alerts.json
docker compose exec booking-service wget -qO- http://localhost:3005/health/live
docker compose exec booking-service wget -qO- http://localhost:3005/metrics | Select-Object -First 5
```

---

## 10. Quick Port Map

```text
api-gateway     3000 internal / 4000 external
booking-service  3005 internal / 4004 external
user-service     3006 internal / 4001 external
movie-service    3007 internal / 4002 external
cinema-service   3008 internal / 4003 external
prometheus       9090
grafana          3009
redis            6379
postgres-user    5435
postgres-movie   5436
postgres-cinema  5437
postgres-booking 5438
```

---

## 11. Notes for On-Call

1. Prefer `docker compose logs`, `docker compose ps`, and the health endpoints before changing anything.
2. Use `curl.exe` on Windows to avoid the PowerShell alias conflict.
3. Keep `jq`, `nc`, `top`, and `nslookup` out of the command path unless a user has explicitly installed them.
4. Save output to files before restarting a service.
5. Escalate if you cannot identify the failure mode within 10 minutes.
