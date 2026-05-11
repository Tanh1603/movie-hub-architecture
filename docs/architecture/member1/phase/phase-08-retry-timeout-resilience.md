# Phase 08 - Retry and Timeout Resilience

## Objective

Muc tieu la hien thuc retry va timeout bounded cho external/internal calls theo ADD/SAD, nhung khong tao framework moi. Phase nay uu tien cau hinh/client-level timeout va retry don gian theo pattern hien co cua tung service.

## Non-Goals

- Do NOT create resilience frameworks (Polly, Resilient HTTP, or equivalents).
- Do NOT implement circuit breakers or bulkhead isolation.
- Do NOT add correlation ID generation or synthetic tracing.
- Do NOT create centralized retry orchestration.
- Do NOT implement rate limiting or quota management.
- Do NOT introduce generic resilience patterns or policy engines.
- Do NOT implement distributed tracing or APM instrumentation.
- Do NOT create retry registries or dynamic timeout configuration.

## Operational Latency Budget

- Single external call timeout: <= 30s (total 3 retries within this budget)
- Single internal service call timeout: <= 10s
- Health check timeout: 2s
- Retry delay sequence: 1s, 2s, 4s (jitter ±10% random)

## Operational Semantics

- **Retry**: explicit bounded logic (3 attempts max, specific errors only, exponential backoff 1/2/4 sec).
- **Timeout**: hard wall-clock limit per call type (external 30s, internal 10s, health 2s).
- **Resilience does NOT mean**: circuit breakers, bulkheads, fallbacks, auto-recovery, dynamic retry policies.
- **Scope**: simple client-level logic, no framework, no shared state across services.
- **Error handling**: retry 5xx, timeout, connection refused. Skip 4xx (user errors, no value in retry).

## Implementation Boundaries

Allowed:

- add inline retry logic inside existing provider adapter
- add axios/http timeout config
- add focused unit tests for retry behavior
- add small helper function local to service module

Forbidden:

- creating RetryService, ResilienceService, TimeoutModule, or similar abstractions
- creating NestJS interceptors/decorators for retry
- creating shared retry libraries
- modifying unrelated HTTP clients
- introducing RxJS-heavy retry pipelines
- adding circuit breakers, queues, or fallback execution
- changing service architecture
- adding global middleware

## Scope

- Services affected:

  - `booking-service` only

- Modules affected:

  - existing payment provider adapter
  - existing notification HTTP client (if already exists)

- Infra/manifests affected:

  - none

- Configs affected:
  - request timeout values only

## Prerequisites

- Phase 01 completed for shared constants/interfaces if needed.
- Existing provider adapters identified.

## Tasks

- Inspect existing outbound HTTP calls in booking-service only.
- Add explicit timeout values directly in existing HTTP client usage:

  - external provider calls: 30s
  - internal calls: 10s
  - health-related calls: 2s

- Add simple inline retry logic ONLY where transient failures are already known to happen:

  - max 3 attempts
  - fixed backoff sequence: 1s → 2s → 4s
  - retry only:
    - timeout
    - ECONNRESET
    - ECONNREFUSED
    - HTTP 5xx
  - do not retry:
    - 4xx
    - validation errors
    - business rule failures

- Log retry attempt count using existing logger context only.
- Return safe domain error on final failure.

- Keep implementation local to affected adapter/client.
- Prefer duplication over abstraction for this phase.

## Expected Deliverables

- Source files (new or updated):
  - service-level client config files in affected services
  - provider adapter files for payment/notification/auth boundaries
- Test files:
  - retry classification and backoff tests
  - timeout behavior tests

## Acceptance Criteria

- Existing outbound provider call retries at most 3 times.
- 4xx responses fail immediately without retry.
- Timeout returns bounded error within configured timeout window.
- Retry implementation stays local to existing adapter/client files.
- No new shared retry module or framework abstraction exists.
- No unrelated service files modified.

## Validation Steps

- Simulate provider 503 and verify retry sequence.
- Simulate provider timeout and verify request returns bounded error within budget.
- Simulate 4xx errors and verify no retry (except 429).

## Test Plan

- Unit tests:
  - retryable error classifier
  - backoff timing calculator
- Integration tests:
  - provider adapter retry with mocked HTTP server
- Failure simulation tests:
  - connection reset, timeout, 5xx flood
- Staging validation:
  - controlled upstream latency/failure injection
- Operational validation:
  - observe retry/timeout metrics in logs and monitoring

## Risks

- Over-retry causing pressure spikes.
- Inconsistent timeout values across services.

## Rollback Strategy

- Revert retry/timeout config files in affected services only.
- Restore previous stable timeout settings.

## Architecture Alignment

- ADD:
  - 2.2.3 (critical commit path bounded)
  - 2.6.2 (external dependency failure handling)
  - 2.7.2 (distributed consistency under retries)
- SAD:
  - 6.1 (booking runtime implication)
  - 8.7 (error handling and retry)
  - 10.1 (availability)
- C4:
  - `c4-dynamic-booking.md` (short synchronous path)
  - `c4-context.md` (external provider boundaries)

# Agent Implementation Prompt

Implement ONLY Phase 08 in `booking-service`.

IMPORTANT:
This phase is intentionally SMALL and LOCALIZED.

Implementation style required:

- inline logic
- local adapter-level changes
- duplication is acceptable
- avoid abstractions

STRICTLY FORBIDDEN:

- RetryService
- ResilienceModule
- shared retry helpers
- decorators/interceptors
- RxJS retry pipelines
- policy engines
- circuit breakers
- fallback execution
- framework-style patterns

Implementation Rules:

1. Inspect existing outbound HTTP usage first.
2. Modify ONLY existing outbound provider adapters/clients.
3. Add direct timeout values in existing request config.
4. Add small inline retry loop near the request call.
5. Maximum retry logic size:
   - <= 30 LOC per adapter
6. Do NOT touch unrelated services.
7. Do NOT refactor HTTP architecture.
8. Use existing logger only.
9. Add focused tests only for:
   - retryable errors
   - non-retryable errors
   - timeout handling

Success Criteria:

- bounded retries
- bounded timeout
- no architecture changes
- no new framework abstractions
