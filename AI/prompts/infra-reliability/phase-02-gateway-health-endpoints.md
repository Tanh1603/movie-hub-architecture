# Phase 02 - Gateway Health Endpoints

## Objective

Muc tieu la chuyen API Gateway tu endpoint health don gian sang cap doi endpoint liveness/readiness dung chuan production, nhung van giu gateway readiness nhe va local-only. Phase nay tuyet doi khong tao fan-out goi den toan bo downstream service.

## Non-Goals

- Do NOT check downstream business service health in gateway readiness.
- Do NOT implement service discovery or dynamic service health aggregation.
- Do NOT add correlation ID generation or synthetic request tracing.
- Do NOT aggregate Redis Pub/Sub or WebSocket adapter status into readiness.
- Do NOT add circuit breaker or bulkhead patterns.
- Do NOT implement @nestjs/terminus or any health framework.
- Do NOT create gateway health service or composition layer.
- Do NOT fan-out probes to other services in readiness checks.
- Do NOT add business-flow health checks or synthetic readiness logic.
- Do NOT create base classes or abstract patterns for health endpoints.
- Do NOT add speculative health indicators or extensible health registries.
- Do NOT implement service mesh, sidecar, or proxy-level health logic.

## Operational Semantics

- **Liveness (gateway)**: process state ONLY. Is NestJS bootstrap complete and event loop responsive? Zero I/O, zero dependency checks.
- **Readiness (gateway)**: local state ONLY. Is gateway configuration loaded? Optional: is gateway's own Redis adapter (if required at runtime) connected? No fan-out to downstream services.
- **Readiness does NOT mean**: booking/user/movie/cinema services are healthy, business flows work, all clients are connected, queues are drained.
- **Allowed dependencies**: existing Redis adapter if gateway uses Redis internally. That's it.
- **Forbidden dependencies**: booking/user/movie/cinema health checks, cross-service calls, synthetic business checks, service discovery.

## Operational Latency Budget

- `/health/live`: respond within 50ms (no I/O, no dependencies)
- `/health/ready`: respond within 100ms (local state only, one quick Redis ping if applicable, no new connections, no fan-out)

## Scope

- Services affected:
  - `api-gateway`
- Modules affected:
  - gateway health controller/module
  - optional small health service in gateway app
- Infra/manifests affected:
  - none
- Configs affected:
  - none

## Prerequisites

- Phase 01 merged.
- Existing `api-gateway` health implementation identified.

## Tasks

- Implement `/health/live` returning 200 + timestamp when NestJS app is initialized (no I/O, memory-only, <50ms response).
- Implement `/health/ready` checking ONLY:
  - Is NestJS app fully bootstrapped? (required, memory-only)
  - Is Redis adapter connected IF and ONLY IF gateway already requires Redis at runtime (optional, one quick ping only)
  - **FORBIDDEN**: do NOT call booking/user/movie/cinema/cinema services
  - **FORBIDDEN**: do NOT ping Redis if gateway doesn't already use it
  - **FORBIDDEN**: do NOT implement nested health checks or health composition
- Return consistent JSON envelope with `status`, `timestamp`, optional `dependencies` map.
- Catch exceptions in readiness checks; return 503 with sanitized error reason (use Phase 01 utility).
- Do NOT add logging, correlation IDs, or observability instrumentation; keep it transient.
- Preserve existing gateway global prefix and versioning settings (do not redesign routing).
- Keep health endpoint implementation under 30 lines of code; if larger, you are over-engineering.

## Expected Deliverables

- Source files (new or updated):

  - `apps/api-gateway/src/app/health.controller.ts`
  - `apps/api-gateway/src/app/.../health*.ts` (if split service/module)
  - `apps/api-gateway/src/app/app.module.ts` (if wiring needed)

- Optional focused tests only if repository conventions already require them.

## Acceptance Criteria

- `GET /api/health/live` returns 200 in 10-50ms consistently (measured 10 consecutive calls).
- `GET /api/health/ready` returns 200 in 20-100ms consistently.
- `GET /api/health/ready` must return 200 when booking-service is stopped or unavailable (no fan-out).
- `GET /api/health/ready` must return 200 when Redis is unavailable (if not gateway-critical).
- Response body contains no raw stack traces, SQL, connection strings, or process internals.
- Readiness failure returns 503 with safe error reason string (e.g., "redis unavailable" not raw error message).

## Validation Steps

- Stop one downstream service and verify gateway `/health/ready` still 200.
- Verify `/health/live` remains 200 while gateway process is running.
- Verify endpoint paths are reachable with current global prefix settings.

## Validation Plan

- Manual validation:

  - call `/health/live`
  - call `/health/ready`
  - stop one downstream service and verify readiness still 200
  - verify no stack traces or infra internals leak

- Optional focused unit tests:

  - readiness failure mapping
  - sanitizer response shape

- No mandatory e2e or integration tests in this phase.

## Risks

- Accidental dependency on downstream service checks.
- Conflict with current `/api/health` consumers.

## Rollback Strategy

- Revert gateway health endpoint changes only.
- Temporarily keep legacy `/api/health` route in parallel if needed.
- Restore prior compose probe target until migration completed.

## Architecture Alignment

- ADD:
  - 2.6.1, 2.6.2, 2.6.3
- SAD:
  - 7.5 (fault tolerance)
  - 10.1 (availability)
  - 4.5 (error handling boundary)
- C4:
  - `c4-containers.md` (thin gateway boundary)
  - `c4-deployment.md` (gateway replicas and routing)

# Agent Implementation Prompt

Implement ONLY Phase 02. Gateway health endpoints (liveness + readiness, no fan-out).

FORBIDDEN (blocks phase if violated):

- Implementing @nestjs/terminus or any health framework.
- Creating health service or composition layer in gateway.
- Fanning out to booking/user/movie/cinema in readiness checks.
- Adding business-flow health logic or synthetic readiness indicators.
- Creating base classes, abstract types, or inheritance patterns for health.
- Adding correlation ID generation or observability instrumentation.
- Refactoring gateway application code or routing.
- Implementing nested health checks or dynamic indicator loading.

Strict Rules:

1. Inspect existing gateway app and main.ts first; preserve structure.
2. Add `/health/live` controller method: return 200 + timestamp, no I/O, <50ms response.
3. Add `/health/ready` controller method: check app bootstrap state, optionally ping gateway's own Redis adapter (if required at runtime), return 200 or 503 with safe error reason.
4. Use Phase 01 sanitizer utility for error payloads.
5. Keep endpoint implementation <30 lines total per service.
6. Manual validation only:

   - verify `/health/live`
   - verify `/health/ready`
   - verify no downstream fan-out
   - verify safe error payloads

7. Optional focused tests only if existing repository conventions require them.
8. Validation: gateway app builds without errors, health endpoints respond correctly, no new dependencies added.
