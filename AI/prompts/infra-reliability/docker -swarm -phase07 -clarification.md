# Docker Compose and Swarm Deployment Clarification

---

## Deployment Platform Clarification

This repository uses:

- Docker Compose for local development runtime
- Docker Swarm for replicated deployment, failover simulation, and rolling update behavior

Implementation MUST align with the existing Docker-based infrastructure already present in the repository.

### Forbidden

Do NOT introduce:

- Kubernetes
- Helm
- Terraform Container Apps
- ECS/EKS
- Service mesh
- Cloud-specific deployment abstractions
- Centralized rollout controllers
- Custom orchestration platforms

This phase is infrastructure-config only and MUST remain lightweight and Docker-native.

---

## Required Deployment Strategy

### Docker Compose

`docker-compose.yml` is responsible for:

- local development
- health probe configuration
- local startup flow
- container health validation

### Docker Swarm

`docker-stack.yml` is responsible for:

- replicated deployment
- rolling update policy
- rollback behavior
- failover simulation
- zero-downtime deployment behavior

---

## Swarm Deployment Requirements

Use Docker Swarm deploy semantics.

Each user-facing service MUST configure:

```yaml
deploy:
  replicas: 2

  update_config:
    parallelism: 1
    delay: 10s
    order: start-first
    failure_action: rollback

  rollback_config:
    parallelism: 1
    order: stop-first

  restart_policy:
    condition: on-failure
```

---

## Health Probe Strategy

Health checks MUST continue using lightweight HTTP probing with existing `wget` pattern.

### Liveness

- Endpoint: `/health/live`
- Purpose: restart unhealthy container

### Readiness

- Endpoint: `/health/ready`
- Purpose: rollout gating and traffic readiness

Docker Swarm health checks should be used as rollout readiness signals.

Do NOT implement custom rollout controllers or orchestration logic.

---

## Expected Deliverables

Expected outputs include:

- updated `docker-compose.yml`
- new or updated `docker-stack.yml`
- minimal deployment/runbook documentation
- optional lightweight deployment helper scripts

Examples:

- `infra/docker-stack.yml`
- `scripts/deploy-stack.sh`
- `docs/runbook-rollout.md`

---

## Explicitly Forbidden Deliverables

Do NOT create:

- Terraform infrastructure
- Kubernetes manifests
- Helm charts
- cloud deployment modules
- auto-scaling systems
- service mesh configuration

---
