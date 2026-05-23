# Phase 03 - Booking Readiness Checks

## Objective

Muc tieu la bo sung health/live va health/ready cho booking-service dung semantics van hanh: liveness chi process, readiness check dung dependency cot loi cua booking (PostgreSQL va Redis). Tat ca check phai nhe, tai su dung client hien co, va khong tao ket noi moi moi request.

## Non-Goals

- Do NOT check external provider reachability (Clerk, payment gateways, notification services).
- Do NOT check booking queue depth or pending transaction state.
- Do NOT implement circuit breakers or fallback behavior.
- Do NOT check other services' health.
- Do NOT add health-check business logic or metrics collection.
- Do NOT implement @nestjs/terminus or any health framework.
- Do NOT create shared health service or booking-level health orchestration.
- Do NOT open new DB/Redis clients per health check request.
- Do NOT create generic readiness composition patterns or base classes.
- Do NOT implement health indicator registries or dynamic loaders.
- Do NOT add correlation ID generation or observability instrumentation.
- Do NOT implement fallback mechanisms or synthetic readiness recovery.
- Do NOT check business state (unconfirmed bookings, pending payments, queue depth).

## Operational Semantics

- **Liveness (booking)**: process state ONLY. Is NestJS bootstrap complete? Zero I/O, zero dependencies.
- **Readiness (booking)**: service-local dependencies ONLY. Can booking reach its PostgreSQL database via existing Prisma provider? Can booking reach its Redis (if required) via existing Redis provider? One quick ping per dependency, no transactions, no complex checks.
- **Readiness does NOT mean**: external providers (payment gateways, notification services) are reachable, other services are healthy, booking business data is consistent, queues are drained, pending bookings are valid.
- **Allowed dependencies**: existing Prisma provider (booking's PostgreSQL), existing Redis provider (booking's Redis, if runtime-required).
- **Forbidden dependencies**: cross-service calls, fan-out probes, external provider checks, business-state validation, synthetic health indicators.

## Operational Latency Budget

- `/health/live`: respond within 50ms (no I/O, no dependencies check)
- `/health/ready`: respond within 100ms (one quick DB ping + one quick Redis ping only, no transactions, no connection pool exhaustion)

## Scope

- Services affected:
  - `booking-service`
- Modules affected:
  - booking app module
  - booking health controller/service
  - existing DB/Redis provider wiring
- Infra/manifests affected:
  - none
- Configs affected:
  - optional health timeout config keys

## Prerequisites

- Phase 01 merged.
- Existing booking DB and Redis providers identified.

## Tasks

- Implement `/health/live` returning 200 when app bootstrap complete (no DB/Redis check, memory-only, <50ms response).
- Implement `/health/ready` checking ONLY these booking-critical dependencies:
  - PostgreSQL: use existing Prisma client provider (REUSE, no new pool, no transaction).
  - Redis: use existing Redis provider (REUSE, no new connections, one quick ping).
  - Both must respond within 500ms total; return 503 if either times out.
  - Do NOT check external providers (Clerk, payment gateways, notification endpoints).
- Catch DB/Redis exceptions; return 503 with safe error reason (use Phase 01 sanitizer utility, no raw SQL/DSN/stack trace).
- Readiness failure must return 503 without terminating process (no `process.exit()`).
- Keep all logic local to booking-service; no shared orchestration, framework, or composition layer.
- Keep endpoint implementation under 30 lines of code per endpoint.
- Do NOT create booking health service or provider; keep logic inline in controller if small enough.

## Expected Deliverables

- Source files (new or updated):
  - `apps/booking-service/src/app/health*.ts`
  - `apps/booking-service/src/app/app.module.ts`
  - `apps/booking-service/src/main.ts` (only if endpoint bootstrap wiring is needed)

## Acceptance Criteria

- `/health/live` returns 200 consistently in 10-50ms (no I/O).
- `/health/live` remains 200 when PostgreSQL is stopped.
- `/health/live` remains 200 when Redis is stopped.
- `/health/ready` returns 200 in 50-100ms when both PostgreSQL and Redis are healthy.
- `/health/ready` returns 503 within 500ms when PostgreSQL is unreachable (measured).
- `/health/ready` returns 503 within 500ms when Redis is unreachable (measured).
- No new Prisma or Redis client objects created per health request (reuse existing providers).
- Health check never calls any external provider endpoints or services.

## Validation Steps

- Stop PostgreSQL and verify `/health/ready` returns 503.
- Stop Redis and verify `/health/ready` returns 503.
- Verify `/health/live` still returns 200 during dependency outage.
- Restore dependencies and verify `/health/ready` returns 200 again.

## Testing Notes

- Automated tests optional for this phase.
- Manual validation is sufficient because logic is operational and minimal.
- Do NOT introduce heavy mocking or health-check test frameworks.

## Risks

- Health check accidentally creating transient DB/Redis clients.
- Overly expensive readiness query.

## Rollback Strategy

- Revert booking health module/controller changes.
- Restore previous bootstrapping behavior.
- Keep infra probes pointed to prior endpoint until re-implementation.

## Architecture Alignment

- ADD:
  - 2.6.1 (health based continuity)
  - 2.6.3 (instance removal)
  - 2.7.1 (transactional reliability foundation)
- SAD:
  - 5.1 (booking service as transactional core)
  - 7.5 (fault tolerance)
  - 8.9 (PostgreSQL as source of truth)
- C4:
  - `c4-containers.md` (booking + Redis + PostgreSQL relation)
  - `c4-dynamic-booking.md` (short critical path)

# Agent Implementation Prompt

Implement ONLY Phase 03. Booking service health (liveness + readiness, service-local dependencies).

FORBIDDEN (blocks phase if violated):

- Implementing @nestjs/terminus or any health framework.
- Creating shared health service or booking-level health composition layer.
- Opening new DB/Redis connections per health request (REUSE existing providers only).
- Checking external providers (payment gateways, notification services, Clerk) in readiness.
- Creating generic readiness patterns or base classes for other services to copy.
- Adding health indicator registries or dynamic health loaders.
- Adding correlation ID generation or observability instrumentation.
- Implementing fallback mechanisms or synthetic readiness recovery logic.
- Checking business state (unconfirmed bookings, pending payments, queue depth).

Strict Rules:

1. Inspect booking-service main.ts, Prisma provider module, and Redis provider (if exists).
2. Add `/health/live` controller method: return 200 + timestamp, no I/O, <50ms.
3. Add `/health/ready` controller method: reuse existing Prisma provider to do one quick ping (e.g., `await prisma.$queryRaw(sql\`SELECT 1\`)`), reuse existing Redis provider if booking requires Redis (one quick ping), return 200 or 503.
4. Use Phase 01 sanitizer utility for error payloads (no stack traces, no SQL, no DSN).
5. Total endpoint implementation should remain minimal; avoid over-engineering.
6. No new services, providers, modules, or composition logic.
7. Validate manually:
   - `/health/live` returns 200 during DB/Redis outage
   - `/health/ready` returns 503 when DB or Redis is unavailable
   - readiness recovers automatically after dependencies recover
8. Validation:
   - booking service builds successfully
   - no new dependencies added
   - existing Prisma/Redis clients are reused
   - no connection pool issues introduced
