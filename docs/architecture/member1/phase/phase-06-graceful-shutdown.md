# Phase 06 - Graceful Shutdown and Connection Draining

## Objective

Muc tieu la dam bao moi service NestJS xu ly SIGTERM an toan: dung nhan request moi, cho in-flight request ket thuc trong gioi han hop ly, dong ket noi DB/Redis sach se. Phase nay tranh merge voi retry/backup de giu pham vi de review.

## Non-Goals

- Do NOT implement circuit breakers or fallback strategies.
- Do NOT add custom process managers or orchestration.
- Do NOT implement health-check gating or pre-shutdown validation.
- Do NOT create shared shutdown lifecycle framework.
- Do NOT introduce @nestjs/terminus or any framework for lifecycle management.
- Do NOT implement shutdown hooks across services (each service owns its shutdown).
- Do NOT add correlation ID generation or observability instrumentation.
- Do NOT create recovery or auto-restart mechanisms.
- Do NOT implement speculative shutdown coordination or cross-service shutdown ordering.

## Operational Latency Budget

- SIGTERM reception to graceful shutdown start: < 100ms
- In-flight request drain: target <= 30s
- Total shutdown sequence (from SIGTERM to process exit): <= 35s

## Scope

- Services affected:
  - `api-gateway`
  - `booking-service`
  - `user-service`
  - `movie-service`
  - `cinema-service`
- Modules affected:
  - each service `main.ts`
  - provider lifecycle hooks for DB/Redis if missing
- Infra/manifests affected:
  - none
- Configs affected:
  - optional graceful shutdown timeout env vars

## Prerequisites

- Phases 02-05 completed.
- Existing startup/bootstrapping conventions identified for each service.

## Tasks

- In each service `main.ts`, call `app.enableShutdownHooks()` after NestFactory.create().
- Add minimal SIGTERM handler (10-20 lines of code):
  - Log shutdown start with timestamp.
  - Call `app.close()` which NestJS uses to drain connections.
  - Set hard timeout of 30s; forcefully exit if drain doesn't complete.
- Ensure Prisma provider module hooks close DB connections cleanly (NestJS auto-handles this if enabled).
- Ensure Redis provider/adapter closes connections cleanly on shutdown.
- Add structured shutdown logs (no correlation IDs, just service name, timestamp, reason).
- Keep shutdown logic local to each service main.ts; do NOT create shared shutdown service.

## Expected Deliverables

- Source files (updated):
  - `apps/api-gateway/src/main.ts`
  - `apps/booking-service/src/main.ts`
  - `apps/user-service/src/main.ts`
  - `apps/movie-service/src/main.ts`
  - `apps/cinema-service/src/main.ts`
- Optional provider lifecycle updates for DB/Redis modules.
- Tests:
  - shutdown behavior tests where feasible

## Acceptance Criteria

- SIGTERM signal is received and shutdown begins within 100ms.
- Each service calls `app.enableShutdownHooks()` in main.ts.
- In-flight HTTP requests are allowed to complete (within configured drain window).
- New requests are rejected after shutdown begins (measured by attempt count in logs).
- Prisma and Redis clients close cleanly (no connection leaks or errors in logs).
- Process exits with code 0 on graceful shutdown or code 1 on timeout.
- Shutdown sequence completes within 35s under normal load.
- No process hangs or zombie processes after SIGTERM.

## Validation Steps

- Send SIGTERM during active requests and observe completion behavior.
- Verify no new requests accepted after shutdown begins.
- Verify DB and Redis connections are closed (no connection leaks).

## Test Plan

- Unit tests:
  - lifecycle hook invocation behavior (where testable)
- Integration tests:
  - process signal test in local container
- Failure simulation tests:
  - force slow in-flight request then SIGTERM
- Staging validation:
  - rolling restart with active traffic
- Operational validation:
  - measure interruption window during controlled restart

## Risks

- Incorrect shutdown sequence causing dropped requests.
- Missing closure of shared client leading to resource leaks.

## Rollback Strategy

- Revert per-service `main.ts` shutdown changes selectively.
- Keep previously stable shutdown behavior for unaffected services.

## Architecture Alignment

- ADD:
  - 2.6.3 (operational continuity under failover)
- SAD:
  - 7.5 (fault tolerance)
  - 10.1 (availability)
- C4:
  - `c4-deployment.md` (replicas + rolling operations)

# Agent Implementation Prompt

Implement ONLY Phase 06: SIGTERM handling in main.ts across all five services.

FORBIDDEN (blocks phase if violated):

- Implementing @nestjs/terminus or any lifecycle framework.
- Creating shared shutdown service or composition layer.
- Adding health-check gating or pre-shutdown validation.
- Implementing custom process managers or orchestration logic.
- Adding correlation ID generation or observability instrumentation.
- Implementing fallback mechanisms or recovery logic.
- Creating cross-service shutdown ordering or coordination.

Strict Rules:

1. For EACH service main.ts (gateway, booking, user, movie, cinema) independently:
   - Add `app.enableShutdownHooks()` after NestFactory.create().
   - Add simple SIGTERM handler (10-20 lines):
     - Log shutdown start with timestamp
     - Call `app.close()` to drain in-flight requests
     - Set hard timeout of 30s; if not complete, forcefully exit
2. **NO frameworks**: do NOT create shutdown lifecycle managers or shared orchestration.
3. **NO business logic**: do NOT add health checks or state validation in shutdown.
4. **NO custom logic**: rely on NestJS's built-in `app.close()` to drain requests.
5. Each service independently handles its own Prisma/Redis cleanup via existing providers.
6. Logs: simple structured logs with service name, timestamp, shutdown event.
7. Test: send SIGTERM to running container, verify graceful drain and exit within 35s.
8. Do NOT modify unrelated application code or business services.
9. Validation: each service builds without errors, SIGTERM handling works in local docker-compose.
