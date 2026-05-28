# Quick Start: Phase 05 & 07 Docker Deployment

> Thực thi Phase 05 (liveness probes) và Phase 07 (replicas + failover) trên Docker Compose + Swarm.

---

## 📋 Yêu cầu

- Docker Desktop v4.0+ (hoặc Docker Engine + Compose v2+)
- ~4GB RAM available
- Ports available: 3000, 3005-3008, 5435-5438, 6379, 9090, 3009

---

## 🚀 Setup nhanh (3 bước)

### Bước 1: Verify & Chuẩn bị

```bash
cd /path/to/movie-hub-architecture

# Check Docker version
docker --version
docker compose version

# Ensure all .env files are filled
ls apps/*/. env
cat apps/api-gateway/.env | head -3
```

### Bước 2: Phase 05 - Docker Compose (Liveness Probes)

```bash
# Build images
docker compose build

# Start with single replicas (Phase 05 - local dev mode)
docker compose up -d

# Wait 30 seconds for services to become healthy
sleep 30

# Check status
docker compose ps
# Expected: All services show "(healthy)" status
```

**Verify health:**

```bash
# Test liveness endpoints
curl http://localhost:4000/api/health/live    # API Gateway
curl http://localhost:4001/health/live        # User Service
curl http://localhost:4002/health/live        # Movie Service
curl http://localhost:4003/health/live        # Cinema Service
curl http://localhost:4004/health/live        # Booking Service

# Should all respond with 200 OK + JSON
```

### Bước 3: Phase 07 - Docker Swarm (Replicas + Rolling Update)

```bash
# 3a. Initialize Swarm (one-time)
./scripts/deploy-stack.sh init

# 3b. Deploy stack with replicas
./scripts/deploy-stack.sh deploy

# 3c. Verify replicas (2/2 for each service)
./scripts/deploy-stack.sh status
# Expected: moviehub_booking-service 2/2, etc.

# 3d. Deploy only no build
docker stack deploy -c infra/docker-stack.yml moviehub

```

---

## ✅ Verification Commands

### Phase 05 - Healthcheck Verification

```bash
# Show all containers with health status
docker compose ps

# Inspect healthcheck details
docker inspect --format='{{json .State.Health}}' moviehub-api-gateway | jq

# Follow healthcheck logs
docker logs -f moviehub-api-gateway | grep -i health
```

### Phase 07 - Replica Verification

```bash
# Show all Swarm services
docker service ls

# Show replicas for one service
docker service ps moviehub_booking-service

# Show all tasks (individual container instances)
docker stack ps moviehub

# Real-time monitoring
watch docker service ls
```

---

## 🔧 Testing Failover (Phase 07)

### Test 1: Kill One Replica → Auto-Restart

```bash
# Kill one booking-service replica
./scripts/test-failover.sh kill-replica booking-service

# Watch it auto-restart
watch docker service ps moviehub_booking-service

# After ~20 seconds: should see 2/2 replicas again (one new task)
```

**Verification:**

```bash
# Traffic should continue - no downtime
while true; do
  curl -s http://localhost:4004/health/live | head -c 50
  sleep 2
done
# Should keep returning 200 OK, never fails
```

### Test 2: Test Readiness Endpoints

```bash
# Check if all services are ready for traffic
./scripts/test-failover.sh test-readiness

# Expected output for each service:
# user-service:3006:/health/ready → ✓ OK
# movie-service:3007:/health/ready → ✓ OK
# ...
```

### Test 3: Simulate Bad Deployment → Rollback

```bash
# Simulate deploying a broken image
./scripts/test-failover.sh simulate-bad-deployment booking-service

# Swarm will:
# 1. Try to deploy new image
# 2. Detect readiness failure
# 3. Pause update
# 4. Auto-rollback to previous version
# 5. Service recovers automatically

# Verify service is still healthy
curl http://localhost:4004/health/live
```

---

## 📊 Monitoring

### Real-time Service Status

```bash
# Terminal 1: Watch service replicas
./scripts/test-failover.sh watch-replicas booking-service

# Terminal 2: Watch all services
watch 'docker service ls; echo; docker stack ps moviehub'
```

### Resource Usage

```bash
# Show CPU/Memory per container
docker stats

# Show disk usage
docker system df
```

### Logs

```bash
# Swarm service logs (all replicas)
docker service logs moviehub_booking-service

# Specific container logs
docker logs moviehub_booking-service.1.<random>

# Follow real-time
docker service logs -f moviehub_user-service
```

---

## 🧹 Cleanup

### Stop Phase 05 (Docker Compose)

```bash
docker compose down
```

### Remove Phase 07 Stack (Docker Swarm)

```bash
./scripts/deploy-stack.sh remove
```

### Full Reset (Careful!)

```bash
# Remove stack + volumes
docker stack rm moviehub
docker volume prune -f

# Leave Swarm (will convert back to standalone Docker)
docker swarm leave --force
```

---

## 🐛 Common Issues

### ❌ "docker: command not found"

**Solution:** Install Docker Desktop or Docker Engine

### ❌ Ports already in use

```bash
# Find what's using ports
lsof -i :3000
lsof -i :3005

# Either stop those services or use different ports in docker-compose.yml
```

### ❌ Services stuck "Unhealthy"

```bash
# Check logs
docker logs moviehub-booking-service | tail -20

# Check if endpoint exists
docker exec moviehub-booking-service curl -s http://localhost:3005/health/live

# May need to wait longer for DB migration
docker logs moviehub-booking-service | grep -i prisma
```

### ❌ Swarm "No space left on device"

```bash
# Clean up unused images/volumes
docker system prune -af --volumes
docker volume prune -f
```

### ❌ Replicas not reaching 2/2

```bash
# Check service logs
docker service logs moviehub_booking-service

# Check node resources
docker node ls
docker node inspect $(docker node ls -q) | grep -A5 Resources

# Check task errors
docker service ps moviehub_booking-service --no-trunc
```

---

## 📚 Detailed Docs

- **Phase 05 (Liveness Probes)**: [docs/phase-05-compose-probe-config.md](../docs/phase-05-compose-probe-config.md)
- **Phase 07 (Replicas & Swarm)**: [docs/runbook-docker-swarm.md](../docs/runbook-docker-swarm.md)
- **Troubleshooting**: See "Failures & Recovery" in runbook
- **Original Specs**: [AI/prompts/infra-reliability/](../AI/prompts/infra-reliability/)

---

## ⏱️ Timeline

| Step                | Time      | Result                             |
| ------------------- | --------- | ---------------------------------- |
| Compose build       | 2-5 min   | Images built                       |
| Compose up          | 1-2 min   | Single instances running + healthy |
| Swarm init + deploy | 1-2 min   | 2 replicas per service running     |
| Total               | ~5-10 min | Ready for testing                  |

---

## 🎯 Next Steps

1. ✅ Verify Phase 05 (healthchecks working)
2. ✅ Test Phase 07 (replicas responding to failures)
3. 📖 Review [runbook-docker-swarm.md](../docs/runbook-docker-swarm.md) for operational details
4. 🚀 When ready for cloud: Follow Terraform/Azure deployment docs (Phase N+)

---

**Happy testing!** 🎬

For questions, see troubleshooting above or check original phase documents:

```bash
ls AI/prompts/infra-reliability/phase-05* AI/prompts/infra-reliability/phase-07*
```
