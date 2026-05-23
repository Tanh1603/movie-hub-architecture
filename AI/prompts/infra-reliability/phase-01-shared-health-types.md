# Phase 01 - Shared Health Types

## Objective

Muc tieu cua phase nay la tao hop dong du lieu health check toi thieu, ro rang, de tat ca service dung chung ma khong day hanh vi nghiep vu vao shared library. Phase nay chi chuan hoa interfaces/DTOs/constants nhe de giam sai lech endpoint, khong thay doi cach service tu danh gia readiness.

## Non-Goals

- Do NOT create health indicator registries, dynamic loaders, or plugin systems.
- Do NOT add service-discovery logic or cross-service aggregation.
- Do NOT add business readiness orchestration or dependency graphs.
- Do NOT add health-check invocation logic; only expose contracts.
- Do NOT add retry or timeout logic in shared library.
- Do NOT create abstract base classes or mixin patterns for services.
- Do NOT introduce @nestjs/terminus or any health framework.
- Do NOT create shared health service or health composition logic.
- Do NOT add controller/provider/module implementations to shared-types.
- Do NOT create base classes or parent types for health endpoints.
- Do NOT add speculative extensibility (custom indicators, future-proof structures).
- Do NOT create generic HealthIndicator or AbstractHealthService patterns.
- Do NOT add correlation ID generation or observability instrumentation.

## Operational Semantics

- **Liveness**: only process state (is NestJS bootstrap complete?). Zero I/O, zero dependencies check, sub-100ms response.
- **Readiness**: service-local critical dependencies ONLY (its own DB, its own Redis if required). No fan-out, no downstream service checks, no business-state validation.
- **Readiness does NOT mean**: external providers are reachable, downstream services are available, cached data is fresh, queues are drained, business flows work.
- **Allowed dependencies in readiness**: existing Prisma provider (if service owns PostgreSQL), existing Redis provider (if service owns Redis connections).
- **Forbidden dependencies in readiness**: cross-service calls, health aggregation, fan-out probes, synthetic business checks, framework registries.

## Scope

- Services affected:
  - `api-gateway`
  - `booking-service`
  - `user-service`
  - `movie-service`
  - `cinema-service`
- Modules affected:
  - shared thin library (`libs/shared-types` or existing equivalent)
- Infra/manifests affected:
  - none
- Configs affected:
  - none

## Prerequisites

- Read and align with:
  - `docs/architecture/member1/member1-implementation-plan.md`
  - `docs/architecture/member1/member1-task-checklist.md`
  - `docs/architecture/add.md`
  - `docs/architecture/SAD/sad.md`
  - `docs/architecture/c4/c4-containers.md`

## Tasks

- Add exactly these DTO/interface types to shared library:
  - `HealthLiveResponse` with `status: string` and `timestamp: ISO8601`
  - `HealthReadyResponse` with `status: string`, `timestamp: ISO8601`, `dependencies: {name: string, status: 'UP'|'DOWN'}`
  - `HealthCheckError` with safe `code: string` and `message: string` (no raw internals)
- Add constants for probe endpoint paths:
  - Export `/health/live` and `/health/ready` as string constants.
- Add one tiny sanitizer function (10-20 LOC max):
  - `sanitizeHealthError(error: unknown): HealthCheckError`
  - strips raw error internals, returns generic safe message
- Add explicit code comment: "Shared library provides contracts ONLY. Each service owns readiness composition logic."
- Stop: Do NOT add service registry, plugin mechanism, dynamic indicator loader, or framework abstraction. Violation of this rule blocks phase.

## Expected Deliverables

- Source files in shared library (new or updated):
  - `libs/shared-types/src/.../health/*.ts`
- Export updates (new or updated):
  - `libs/shared-types/src/index.ts` (or existing barrel)
- Unit tests for DTO/utility behavior:
  - `libs/shared-types/src/.../health/*.spec.ts`

## Acceptance Criteria

- Shared package contains ONLY types/interfaces/constants/utility; zero service dependencies imported.
- Sanitizer function serializes any JavaScript error to safe HealthCheckError in under 1ms.
- Sanitizer output contains no stack traces, SQL, connection strings, or stack depth.
- No controller, provider, module, or service implementation in shared health package.
- All five affected apps build without errors after import updates.
- New exports do not create circular dependencies in shared barrel.

## Validation Steps

- Build shared library and affected apps.
- Verify no circular dependency created by shared exports.
- Confirm endpoint constants are identical across services using references.

## Test Plan

- Unit tests:
  - health DTO serialization expectations
  - sanitizer output for timeout, connection refused, unknown error
- Integration tests:
  - none in this phase
- Failure simulation tests:
  - pass mocked infra error objects to sanitizer utility
- Staging validation:
  - none
- Operational validation:
  - none

## Risks

- Accidentally putting readiness behavior in shared library.
- Breaking existing imports with barrel export changes.

## Rollback Strategy

- Revert shared health DTO/constant commits only.
- Restore previous shared export barrel.
- Re-run build for all affected apps.

## Architecture Alignment

- ADD:
  - 2.6.1 (availability via health signaling)
  - 2.6.3 (operational continuity)
- SAD:
  - 4.5 (cross-service rules)
  - 5.1 (container boundaries)
- C4:
  - `c4-containers.md` (service boundary ownership)
  - `c4-deployment.md` (health-driven operations)

# Agent Implementation Prompt

Implement ONLY Phase 01. Strict anti-pattern enforcement.

FORBIDDEN (blocks phase if violated):

- Introducing @nestjs/terminus, any health framework, or plugin system.
- Adding controllers, providers, modules, or services to shared-types.
- Creating base classes, abstract types, or inheritance hierarchies for health.
- Adding service imports or cross-service logic to shared package.
- Creating health composition, registration, or orchestration patterns.
- Adding speculative types ("future-proofing" custom indicators, extensible registries).
- Refactoring existing shared-types exports or barrel structure.
- Adding correlation ID generation or observability instrumentation.

Strict Rules:

1. Inspect existing shared-types patterns and export barrel first; do not redesign.
2. Add ONLY: thin types (interfaces/DTOs), constants (string literals), and ONE sanitizer utility function.
3. Keep total new code under 50 lines; if exceeding, you are over-engineering.
4. Unit tests for sanitizer ONLY: test edge cases (null, undefined, error objects, circular refs) in isolation.
5. Zero service imports; zero framework dependencies added to package.json.
6. Validation: build all five services without errors. Zero circular deps. Zero lint warnings.
7. Do NOT touch application code or business logic.
8. Prefer duplication over abstraction: if next phase needs similar sanitizer for different error type, duplicate it locally instead of extending shared sanitizer.
