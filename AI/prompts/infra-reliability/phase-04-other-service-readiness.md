# Phase 04 - Other Service Readiness

## Objective

Muc tieu la ap dung health/live va health/ready cho user-service, movie-service, cinema-service theo nguyen tac moi service tu so huu readiness composition cua chinh no. Phase nay khong gom gateway va booking-service vi da tach rieng.

## Non-Goals

- Do NOT create shared health orchestration or generic readiness framework across services.
- Do NOT add inter-service health checks or dependencies.
- Do NOT implement health-check business logic or state validation.
- Do NOT add synthetic readiness criteria (like checking booking counts or cache hit rates).
- Do NOT consolidate health endpoints or routes.
- Do NOT implement @nestjs/terminus or any health framework.
- Do NOT create base classes or abstract health patterns for reuse.
- Do NOT implement health indicator registries or dynamic composition.
- Do NOT add correlation ID generation or observability instrumentation.
- Do NOT check business state or synthetic health conditions.
- Do NOT implement fallback mechanisms or recovery logic.

## Operational Semantics

- **Liveness (all services)**: process state ONLY per service. Is NestJS bootstrap complete? Zero I/O, zero dependencies.
- **Readiness (all services)**: service-local dependencies ONLY. Can this service reach its PostgreSQL? Can it reach Redis (if required)? One quick ping per dependency, no transactions.
- **Readiness does NOT mean**: other services are healthy, business data is consistent, queues are drained, downstream flows work.
- **Allowed dependencies**: each service's own Prisma provider (PostgreSQL), each service's own Redis provider (if runtime-required).
- **Forbidden dependencies**: cross-service calls, health aggregation, fan-out probes, business-state checks, synthetic health indicators.
- **Service-local ownership**: User service owns its readiness. Movie service owns its readiness. Cinema service owns its readiness. No shared composition.

## Operational Latency Budget

- `/health/live`: respond within 50ms per service (no I/O, no dependencies)
- `/health/ready`: respond within 100ms per service (quick DB ping only, no transactions)

## Scope

- Services affected:
  - `user-service`
  - `movie-service`
  - `cinema-service`
- Modules affected:
  - per-service health controller/module
  - per-service DB/Redis provider usage (neu service co dung Redis)
- Infra/manifests affected:
  - none
- Configs affected:
  - optional per-service health timeout env vars

## Prerequisites

- Phase 01 merged.
- Phase 03 completed and used as implementation template.

## Tasks

- For each service (user, movie, cinema) independently:
  - Implement `/health/live` returning 200 when app bootstrap complete (memory-only, no I/O).
  - Implement `/health/ready` checking ONLY that service's PostgreSQL (use existing Prisma provider).
  - Optional: Redis check only if that service already requires Redis at runtime (do NOT add Redis dependency).
  - Catch DB exceptions; return 503 with sanitized error (no raw SQL/DSN).
  - Readiness failure must NOT crash process.
- Do NOT add shared health service or generic provider across these three services.
- Do NOT check cross-service dependencies; each service is independent.
- Use consistent response envelope format (match Phase 02/03 pattern).
- Each service owns its health logic; do NOT refactor into a shared pattern after one service works.

## Expected Deliverables

- Source files (new or updated) per service:
  - `apps/user-service/src/app/health*.ts`
  - `apps/movie-service/src/app/health*.ts`
  - `apps/cinema-service/src/app/health*.ts`
  - corresponding `app.module.ts` and `main.ts` updates where needed

## Acceptance Criteria

- All three services expose `/health/live` and `/health/ready` routes.
- `/health/live` returns 200 consistently in 10-50ms per service (no I/O).
- `/health/live` remains 200 when that service's DB is stopped.
- `/health/ready` returns 200 in 50-100ms when PostgreSQL is healthy for each service.
- `/health/ready` returns 503 within 500ms when that service's PostgreSQL is unreachable.
- Zero cross-service health checks (verified by code inspection: no HTTP calls between services).
- No raw infrastructure errors exposed in health response bodies.

## Validation Steps

- For each service, stop its DB and verify `/health/ready` -> 503.
- Verify `/health/live` remains 200 while process remains up.
- Verify no outbound check to other service endpoints appears in readiness logs.

## Risks

- Inconsistent readiness criteria between services.
- Copy-paste logic causing wrong dependency checks.

## Rollback Strategy

- Revert health endpoint changes service-by-service (independent rollback).
- Keep stable services unchanged while fixing one failing service.

## Architecture Alignment

- ADD:
  - 2.6.1, 2.6.3
- SAD:
  - 4.5 (service encapsulation)
  - 5.1 (container boundaries)
  - 7.2 (failure zones)
- C4:
  - `c4-containers.md` (database-per-service ownership)
  - `c4-deployment.md` (independent service health)

# Agent Implementation Prompt

Implement ONLY Phase 04 across three services: `user-service`, `movie-service`, `cinema-service`.

FORBIDDEN (blocks phase if violated):

- Implementing @nestjs/terminus or any health framework.
- Creating shared health service or extracting common health patterns.
- Copying/importing health code from booking-service or other services (duplicate instead).
- Adding inter-service health checks or dependencies.
- Creating health registries or dynamic composition.
- Adding correlation ID generation or observability instrumentation.
- Checking business state or synthetic readiness conditions.
- Consolidating health endpoints or routes across services.

Strict Rules:

1. Inspect Phase 03 (booking-service) ONLY for endpoint signature consistency. Each service implements independently.
2. **Duplicate over extract**: if user-service health looks like booking-service health, keep duplicated code. Do NOT create shared base class or extract pattern.
3. **Service-local ownership**: each service fully owns its /health/live and /health/ready implementations.
4. **NO cross-service checks**: readiness must NOT query booking, user, movie, cinema, or gateway services.
5. **NO frameworks**: no registries, no dynamic composition, no base classes.
6. For EACH service (user, movie, cinema) independently:
   - Inspect existing main.ts and Prisma provider.
   - Add `/health/live` controller method: return 200 + timestamp, no I/O, <50ms.
   - Add `/health/ready` controller method: reuse existing Prisma provider, quick ping only, return 200 or 503, <100ms.
   - Use Phase 01 sanitizer utility for error payloads.
   - Keep implementation <30 lines per endpoint.
7. Validation:
   - verify each service exposes `/health/live` and `/health/ready`
   - verify readiness returns 503 when local DB is unavailable
   - verify no cross-service health checks exist
8. All three services must build without new dependencies or framework additions.
