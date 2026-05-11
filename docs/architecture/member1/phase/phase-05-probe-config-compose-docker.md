# Phase 05 - Probe Config for Compose and Docker

## Objective

Muc tieu la cap nhat Docker Compose va Docker HEALTHCHECK de su dung cac `/health/live` endpoint moi da duoc them o cac phase truoc, trong khi van giu nguyen deployment strategy va operational baseline hien co cua repo.

Phase nay chi sua runtime/deployment config toi thieu de dong bo voi health endpoint moi. Khong redesign Docker setup, khong thay doi business logic.

---

## Non-Goals

- Do NOT refactor deployment scripts or Docker architecture.
- Do NOT introduce Kubernetes, Helm, service mesh, or orchestration abstractions.
- Do NOT redesign current probe timing strategy unless absolutely required.
- Do NOT change readiness endpoint logic or application business logic.
- Do NOT create centralized health probe configuration.
- Do NOT add observability, tracing, or correlation ID instrumentation.
- Do NOT replace existing lightweight probe tooling (`wget`) with heavier alternatives unless required.

---

## Operational Semantics

- Docker health checks target `/health/live` only.
- Liveness probes only verify that the process is responsive.
- Readiness orchestration remains application-level and is NOT part of Docker Compose probe logic.
- Existing operational timing values should be preserved where already stable.

---

## Scope

### Services affected

- `api-gateway`
- `booking-service`
- `user-service`
- `movie-service`
- `cinema-service`

### Infra/config files affected

- `docker-compose.yml`
- Existing Dockerfile `HEALTHCHECK` sections (only if path mismatch exists)

---

## Prerequisites

- Phase 02 completed (gateway health endpoints)
- Phase 03 completed (booking readiness)
- Phase 04 completed (user/movie/cinema readiness)

---

## Tasks

### Docker Compose Healthcheck Migration

Update existing service health checks to target the new liveness endpoints:

- API Gateway:

  - `http://localhost:3000/api/health/live`

- Booking Service:

  - `http://localhost:3005/health/live`

- User Service:

  - `http://localhost:3006/health/live`

- Movie Service:

  - `http://localhost:3007/health/live`

- Cinema Service:

  - `http://localhost:3008/health/live`

### Probe Strategy

Keep the current lightweight Docker probe strategy already used in the repository:

```yaml
interval: 30s
timeout: 5s
retries: 3
start_period: 10s
```

Do NOT aggressively reduce probe thresholds unless current values are proven problematic.

### Tooling

- Prefer existing `wget --spider` pattern already used by the repo.
- Avoid introducing additional probe tooling or shell wrappers.
- Keep probe commands simple and container-friendly.

### Dockerfiles

- Only update Dockerfile `HEALTHCHECK` commands if they still use placeholder checks like:

  - `node --version`

- Keep Dockerfile changes minimal and path-focused only.

---

## Expected Deliverables

Updated:

- `docker-compose.yml`
- Relevant service Dockerfiles (only if required)

No new deployment scripts or orchestration layers.

---

## Acceptance Criteria

- All microservices use HTTP-based liveness probes.
- All probes target `/health/live`.
- Existing Docker Compose startup flow remains compatible.
- No changes to readiness/business logic.
- No additional runtime dependencies introduced.
- `docker compose up -d` works without probe errors.
- Existing operational timings remain stable for local development usage.

---

## Validation Steps

- Start compose stack normally.
- Verify containers eventually transition to `healthy`.
- Verify `/health/live` endpoints respond correctly inside containers.
- Verify no probe command failures appear in container logs.

---

## Risks

- Endpoint path mismatch between app and compose config.
- Overly aggressive probe thresholds causing false unhealthy states during Prisma bootstrap.

---

## Rollback Strategy

- Revert Docker Compose and Dockerfile probe changes only.
- Restore previous probe commands temporarily if endpoint mismatch occurs.

---

## Architecture Alignment

- ADD:

  - 2.6.1
  - 2.6.3

- SAD:

  - 7.1
  - 7.5

- C4:

  - `c4-deployment.md`

# Agent Implementation Prompt

Implement ONLY Phase 05.

Update existing Docker Compose and Dockerfile healthcheck configuration to use the new `/health/live` endpoints while preserving the current deployment approach and probe timing strategy already used in the repository.

Keep changes minimal and config-only.
Do not redesign Docker setup, orchestration, or application logic.
