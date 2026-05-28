# Docker Swarm Deployment Runbook

## Phase 05 & 07 - Probe Configuration and Replica/Failover Strategy

> This runbook covers Phase 05 (liveness/readiness probe configuration in Docker Compose) and Phase 07 (replica deployment, failover, and rolling updates using Docker Swarm).

---

## Quick Start

### 1. Initialize Docker Swarm (One-time setup)

```bash
./scripts/deploy-stack.sh init
```

This initializes Docker Swarm on your local machine (needed for multi-replica deployment).

### 2. Build and Deploy Stack

```bash
./scripts/deploy-stack.sh deploy
```

This will:

- Build all service images
- Tag them for Swarm
- Deploy the stack with 2 replicas per service
- Show service status

### 3. Verify Deployment

```bash
./scripts/deploy-stack.sh status
```

Expected output shows all services running with 2/2 replicas each (e.g., `2/2`):

```
moviehub  active
NAME                             REPLICAS   IMAGE                                  PORTS
moviehub_api-gateway             2/2        moviehub-api-gateway:latest            3000:3000
moviehub_booking-service         2/2        moviehub-booking-service:latest        3005:3005
moviehub_cinema-service          2/2        moviehub-cinema-service:latest         3008:3008
moviehub_movie-service           2/2        moviehub-movie-service:latest          3007:3007
moviehub_user-service            2/2        moviehub-user-service:latest           3006:3006
```

---

## Architecture Overview

### Deployment Layers

| Layer        | Phase | Technology           | Purpose                                         |
| ------------ | ----- | -------------------- | ----------------------------------------------- |
| Local Dev    | 05    | Docker Compose       | Single-instance development with health checks  |
| Demo/Staging | 07    | Docker Swarm         | Multi-replica, zero-downtime updates, failover  |
| Production   | N/A   | (Terraform on Azure) | Cloud-native deployment (out of scope for demo) |

### Health Probe Strategy

**Phase 05** defines probe endpoints:

- **Liveness** (`/health/live`): Process responsiveness, triggers container restart
- **Readiness** (`/health/ready`): Dependency check (DB/Redis connected), gates traffic during rollout

**Phase 07** applies probe semantics:

- Swarm monitors liveness: if 3 consecutive failures → restart container
- Swarm monitors readiness: if readiness fails → hold replica out of traffic during rolling update
- Traffic routing uses DNS: Docker Swarm's overlay network load-balances across healthy replicas

### Service Configuration

Each service is configured with:

```yaml
deploy:
  replicas: 2 # Two replicas for zero-downtime
  update_config:
    parallelism: 1 # Update one replica at a time
    order: start-first # Start new instance before stopping old
    failure_action: rollback # Rollback if update fails
  restart_policy:
    condition: on-failure # Auto-restart on crash
```

---

## Probe Endpoint Details

### API Gateway

- **Internal port**: 3000
- **Liveness**: `GET http://localhost:3000/api/health/live`
- **Readiness**: `GET http://localhost:3000/api/health/ready`
- **Timeout**: 2s (readiness), 5s (liveness)

### Microservices (User, Movie, Cinema, Booking)

- **Internal ports**: 3005 (booking), 3006 (user), 3007 (movie), 3008 (cinema)
- **Liveness**: `GET http://localhost:{port}/health/live`
- **Readiness**: `GET http://localhost:{port}/health/ready`
- **Timeout**: 2s (readiness), 5s (liveness)

### Testing Probe Endpoints

From your local machine:

```bash
# Test liveness (should respond quickly)
curl http://localhost:3000/api/health/live
curl http://localhost:3005/health/live

# Test readiness (checks dependencies)
curl http://localhost:3000/api/health/ready
curl http://localhost:3005/health/ready
```

From inside a container:

```bash
docker exec <container-id> wget -qO- http://localhost:3005/health/ready
```

---

## Operational Tasks

### Monitor Service Health

```bash
./scripts/deploy-stack.sh status
```

Or watch in real-time:

```bash
./scripts/test-failover.sh watch-replicas booking-service
```

### Deploy a New Version

To update a service with a new image:

```bash
# Build new image
docker compose -f docker-compose.yml build booking-service

# Tag it
docker tag moviehub-booking-service:latest moviehub-booking-service:latest

# Push to registry (if using registry)
docker push your-registry/moviehub-booking-service:latest

# Update service in Swarm
docker service update --image moviehub-booking-service:latest moviehub_booking-service
```

Swarm will then:

1. Start new replica with new image
2. Wait for readiness probe to pass
3. Stop old replica
4. Repeat for next replica (one at a time)
5. If any step fails: rollback to previous image

### Simulate Service Failure

To test failover behavior (kill one replica):

```bash
./scripts/test-failover.sh kill-replica booking-service
```

This will:

1. Terminate one running replica
2. Show Swarm automatically detecting failure
3. Swarm auto-restarts the failed replica on another node (or same node)
4. Verify other replica(s) continue serving traffic

### Simulate Bad Deployment

To test rollback on deployment failure:

```bash
./scripts/test-failover.sh simulate-bad-deployment booking-service
```

This will:

1. Update service with broken image
2. Observe Swarm pausing update (readiness fails)
3. Trigger automatic rollback to previous version
4. Restore service availability

### Test All Readiness Endpoints

```bash
./scripts/test-failover.sh test-readiness
```

This verifies all services are ready (dependencies connected).

---

## Failure Scenarios & Recovery

### Scenario 1: One Replica Crashes

**Sequence:**

1. Container process dies or health check fails 3x
2. Swarm detects failure (health check timeout)
3. Swarm restarts container on same or different node
4. Other replica(s) continue serving traffic (zero-downtime)
5. Client requests automatically routed to healthy replica(s)

**Verification:**

```bash
./scripts/test-failover.sh kill-replica user-service
# Watch replicas come back online
docker service ps moviehub_user-service
```

### Scenario 2: Network Partition

**Sequence:**

1. One replica becomes unreachable
2. Swarm health check times out repeatedly
3. Replica marked "unhealthy" → removed from DNS
4. Other replica(s) receive all traffic
5. If partition heals → replica rejoins

**Mitigation:**

- Readiness probe ensures failed instance doesn't receive traffic
- Multiple replicas ensure at least one remains available

### Scenario 3: Database Connection Fails

**Sequence:**

1. Database goes offline
2. All replicas' readiness probes fail
3. Swarm pauses new deployments (readiness gate)
4. Existing instances continue (liveness = process OK)
5. Once DB recovers → readiness passes → new traffic accepted

**Verification:**

```bash
# Stop database
docker stop moviehub-postgres-booking

# Check service readiness
curl http://localhost:3005/health/ready  # Fails with 503

# Check liveness (should still pass)
curl http://localhost:3005/health/live   # Passes with 200

# Restart database
docker start moviehub-postgres-booking

# Readiness recovers
curl http://localhost:3005/health/ready  # Passes with 200
```

### Scenario 4: Bad Deployment / Unhealth Code

**Sequence:**

1. Deploy new version of service
2. New replica starts but readiness probe fails (e.g., DB migration fails)
3. Swarm pauses update (failure_action: rollback)
4. Operator observes failure in `docker service ps`
5. Swarm automatically rolls back to previous working image
6. Service recovers

**Verification:**

```bash
./scripts/test-failover.sh simulate-bad-deployment booking-service
```

---

## Rolling Update Deep Dive

### Phase 07 Rolling Update Policy

```yaml
update_config:
  parallelism: 1 # Update max 1 replica at a time
  delay: 10s # Wait 10s between replica updates
  order: start-first # Start new before stopping old (zero-downtime)
  failure_action: rollback

rollback_config:
  parallelism: 1 # Rollback max 1 replica at a time
  order: stop-first # Stop old replicas first
```

### Update Sequence (2 replicas per service)

1. **Replica 1 Update**

   ```
   [Old-R1] → [New-R1 starting]
                ↓
   [Old-R1] ← [New-R1 healthy]
                ↓
   [Removed] ← [New-R1] + [Old-R2]  (both serving traffic)
   ```

2. **Replica 2 Update**

   ```
   [New-R1] + [Old-R2] → [New-R1] + [New-R2 starting]
                           ↓
   [New-R1] + [Old-R2] ← [New-R1] + [New-R2 healthy]
                           ↓
   [New-R1] + [Removed] ← [New-R1] + [New-R2]  (both new)
   ```

3. **Readiness Gate**
   - Between steps: Swarm waits for new replica's readiness probe to pass
   - Readiness gates traffic: `/health/ready` must return 200 before traffic shifts
   - If readiness fails: update pauses, operator reviews, manual resume or rollback

### Manual Rollback

If you need to rollback immediately:

```bash
# Get service name
docker service ls | grep booking

# Rollback to previous version
docker service update --rollback moviehub_booking-service

# Watch rollback progress
docker service ps moviehub_booking-service
```

---

## Pre-Deployment Checklist

- [ ] Docker Daemon running
- [ ] Docker Swarm initialized: `docker info | grep Swarm`
- [ ] Stack file present: `infra/docker-stack.yml`
- [ ] All env files filled: `apps/*/.env` and `apps/*/.env.db`
- [ ] Images built or registry credentials configured
- [ ] Network interfaces available (port conflicts?)
- [ ] Sufficient disk space for database volumes
- [ ] Database migrations up-to-date (Phase 09a)

---

## Troubleshooting

### Services Stuck in "Pending" State

**Symptom:** `docker service ps` shows tasks in "Pending" state.

**Cause:**

- Image not found
- Port already in use
- Insufficient resources

**Solution:**

```bash
# Check service error
docker service ps moviehub_booking-service

# Check logs (if task started)
docker logs <container-id>

# Free up ports
netstat -tuln | grep 3005

# Rollback
docker service rollback moviehub_booking-service
```

### Replicas Keep Restarting

**Symptom:** `docker service ps` shows many task restarts.

**Cause:**

- Healthcheck failing
- Dependency (DB) not ready
- Resource exhaustion

**Solution:**

```bash
# Check healthcheck logs
docker logs <container-id>

# Verify database is healthy
docker compose ps postgres-booking

# Check resource usage
docker stats

# Increase start_period delay
docker service update --health-start-period 30s moviehub_booking-service
```

### Readiness Probe Failing

**Symptom:** `curl http://localhost:3005/health/ready` returns 503.

**Cause:**

- Database not connected
- Redis not available
- Missing dependencies

**Solution:**

```bash
# Check dependencies
docker compose ps postgres-booking redis

# Verify connectivity from inside container
docker exec <container-id> sh
  # Inside container:
  psql -h postgres-booking -U postgres -d movie_hub_booking -c "SELECT 1;"
  redis-cli -h redis ping

# Check app logs
docker logs <container-id>
```

### Update Stuck / Not Progressing

**Symptom:** Deployment seems to hang, tasks not transitioning.

**Cause:**

- Readiness probe timeout
- Resource limit reached
- Manual pause

**Solution:**

```bash
# Check service update status
docker service ps moviehub_booking-service

# Force update progress (risky: may cause brief downtime)
docker service update --force moviehub_booking-service

# Or rollback
docker service rollback moviehub_booking-service
```

---

## Performance & Scaling

### Current Configuration

- **Replicas**: 2 per service (satisfies "min 2 instances" requirement)
- **Update Policy**: 1 at a time (strict zero-downtime)
- **Probe Interval**: 30s liveness, 10s readiness (local demo tuning)

### Adjusting for Production

For production on Azure/cloud:

- Increase replicas: 3-5 per service (higher availability)
- Reduce probe intervals: 15s liveness, 5s readiness (faster failure detection)
- Add resource limits: CPU/memory requests in `deploy.resources`
- Add placement constraints: spread replicas across nodes

See `AI/prompts/infra-reliability/phase-07-replica-failover-rollout.md` for cloud deployment guidance.

---

## Related Documentation

- [Phase 05 - Probe Config](../AI/prompts/infra-reliability/phase-05-probe-config-compose-docker.md)
- [Phase 07 - Replica & Failover](../AI/prompts/infra-reliability/phase-07-replica-failover-rollout.md)
- [Phase 06 - Graceful Shutdown](../AI/prompts/infra-reliability/phase-06-graceful-shutdown.md)
- [Docker Swarm Reference](https://docs.docker.com/engine/swarm/)
- [Docker Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

## Commands Quick Reference

```bash
# Setup
./scripts/deploy-stack.sh init             # Initialize Swarm
./scripts/deploy-stack.sh deploy           # Deploy stack

# Monitor
./scripts/deploy-stack.sh status           # Show status
./scripts/test-failover.sh watch-replicas booking-service

# Test
./scripts/test-failover.sh kill-replica booking-service
./scripts/test-failover.sh test-readiness
./scripts/test-failover.sh simulate-bad-deployment

# Update
docker service update --image moviehub-booking-service:v2 moviehub_booking-service

# Rollback
docker service rollback moviehub_booking-service

# Cleanup
./scripts/deploy-stack.sh remove           # Remove stack
docker swarm leave --force                 # Leave Swarm (careful!)
```

---

**Last Updated**: May 2026  
**Version**: 1.0 (Phase 05 & 07)
