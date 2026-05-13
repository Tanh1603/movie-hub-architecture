# Phase 08 - Retry and Timeout Resilience

## Objective

Implement lightweight retry and timeout resilience for outbound integrations in `booking-service` only, aligned with ADD/SAD and current code structure. This phase uses LOCAL adapter boundaries so provider-specific behavior stays isolated from domain services.

Primary adapter targets:

- `PaymentProviderAdapter` (payment outbound integration)
- `NotificationProviderAdapter` (notification outbound integration)

Current booking-service context to keep aligned:

- `src/app/payment/payment.service.ts`
- `src/app/notification/notification.service.ts`

## Non-Goals

- Do NOT create any shared resilience framework across services.
- Do NOT create `RetryService`, `ResilienceModule`, `TimeoutModule`, or equivalents.
- Do NOT use interceptors, decorators, or policy engines for retry/timeout.
- Do NOT implement circuit breaker, bulkhead, or fallback orchestration.
- Do NOT expand scope outside `booking-service`.
- Do NOT introduce cross-service reusable retry libraries in this phase.

## Operational Latency Budget

- Single external provider call timeout: <= 30s
- Single internal service call timeout: <= 10s
- Health check timeout: 2s
- Retry delay sequence: 1s, 2s, 4s (jitter ±10% random)

## Operational Semantics

- **Adapter-first outbound calls**: payment and notification outbound calls are executed through local adapters (`PaymentProviderAdapter`, `NotificationProviderAdapter`).
- **Retry location**: retry loop is implemented inside each adapter method, close to the actual outbound request.
- **Timeout location**: timeout is configured directly inside adapter request configuration.
- **Retry policy**: max 3 attempts with bounded exponential backoff `1s -> 2s -> 4s` (optional jitter).
- **Retryable failures**: timeout, `ECONNRESET`, `ECONNREFUSED`, and HTTP `5xx`.
- **Non-retryable failures**: `4xx` (except `429` if explicitly needed by adapter), validation errors, and business-rule errors.
- **No global orchestration**: each adapter owns its own logic; duplication between adapters is acceptable for this phase.

## Implementation Boundaries

Allowed:

- add or refine local adapter classes/interfaces in `booking-service` for outbound provider calls
- add inline retry loop inside adapter implementation methods
- add request timeout config directly in adapter request execution
- add focused adapter-level unit tests for timeout/retry classification
- keep payment and notification adapter logic independent, even if duplicated

Forbidden:

- creating `RetryService`, `ResilienceService`, `ResilienceModule`, or similar abstractions
- creating NestJS interceptors/decorators for retry or timeout
- creating shared retry helpers/libraries used outside local adapter files
- introducing RxJS-heavy retry pipelines or policy-based engines
- adding circuit breakers, queues, saga orchestration, or fallback pipelines
- modifying services outside `booking-service`

## Scope

- Services affected:

  - `booking-service` only

- Modules affected:

  - payment outbound adapter layer (`PaymentProviderAdapter`) used by payment module
  - notification outbound adapter layer (`NotificationProviderAdapter`) used by notification module
  - service wiring in `src/app/payment/payment.service.ts` and `src/app/notification/notification.service.ts` only as needed to call adapters

- Infra/manifests affected:

  - none

- Configs affected:
  - request timeout values only

## Prerequisites

- Existing outbound payment/notification call points in `booking-service` identified.
- Local adapter interfaces (or equivalent local provider boundaries) defined in booking modules.

## Tasks

1. Inspect current outbound integration calls in `booking-service` payment and notification flows.
2. Introduce or update local adapter boundaries:
   - `PaymentProviderAdapter`
   - `NotificationProviderAdapter`
3. Move outbound request execution behind these adapters (if still called directly elsewhere).
4. In each adapter implementation, add local timeout configuration:
   - external provider calls: 30s
   - internal calls (if any): 10s
   - health-related calls (if any): 2s
5. In each adapter implementation, add local bounded retry loop:
   - max 3 attempts
   - backoff: `1s -> 2s -> 4s`
   - retry only timeout/network transient and HTTP `5xx`
6. Keep retry classification local per adapter; no shared retry utility required.
7. Log retry attempt metadata using existing local logger only.
8. Return domain-safe error after final attempt.
9. Add focused tests at adapter/service boundary for retry and timeout behavior.

## Expected Deliverables

- Source files (new or updated):
  - `booking-service` local payment adapter files (`PaymentProviderAdapter` + implementation)
  - `booking-service` local notification adapter files (`NotificationProviderAdapter` + implementation)
  - minimal wiring updates in `payment.service.ts` and `notification.service.ts` where adapter is used
- Test files:
  - adapter-level retry classification and max-attempt tests
  - adapter-level timeout behavior tests

## Acceptance Criteria

- Payment outbound calls go through `PaymentProviderAdapter` local boundary in `booking-service`.
- Notification outbound calls go through `NotificationProviderAdapter` local boundary in `booking-service`.
- Each adapter enforces max 3 retry attempts for retryable failures.
- HTTP `4xx` fail immediately (except explicitly handled `429` logic if implemented).
- Timeout behavior is bounded by configured per-call limits.
- Retry/timeout logic exists inside adapter implementations, not global modules.
- No `RetryService`, no `ResilienceModule`, no interceptors/decorators, no policy engine, no circuit breaker.
- No changes outside `booking-service`.

## Validation Steps

- Simulate payment provider `503` and verify adapter retry sequence (`1s -> 2s -> 4s`, max 3).
- Simulate notification provider timeout and verify bounded failure response.
- Simulate `4xx` response and verify immediate failure without retry.
- Confirm adapter wiring is local to booking payment/notification modules.

## Test Plan

- Unit tests:

  - `PaymentProviderAdapter`: retryable vs non-retryable classification
  - `PaymentProviderAdapter`: max-attempt and timeout behavior
  - `NotificationProviderAdapter`: retryable vs non-retryable classification
  - `NotificationProviderAdapter`: max-attempt and timeout behavior

- Integration tests:

  - mocked payment provider returning `5xx`
  - mocked notification provider timeout scenario

- Validation:
  - verify `4xx` responses are not retried
  - verify total retry count <= 3 per adapter call

## Risks

- Over-retry can increase outbound pressure during provider degradation.
- Local duplication can drift if not covered by tests.

## Rollback Strategy

- Revert local adapter retry/timeout changes in `booking-service` only.
- Restore previous payment/notification outbound behavior.

## Architecture Alignment

- ADD:
  - 2.2.3 (critical commit path bounded)
  - 2.6.2 (external dependency failure handling)
  - 2.7.2 (distributed consistency under retries)
- SAD:
  - service boundary ownership and external adapter isolation
  - booking runtime bounded path for external calls
  - fault isolation by keeping provider semantics outside booking core
- C4:
  - `c4-dynamic-booking.md` (short synchronous path)
  - `c4-context.md` (external provider boundaries)

# Agent Implementation Prompt

Implement ONLY Phase 08 in `booking-service`.

IMPORTANT:
This phase is intentionally SMALL and LOCALIZED.

Architecture intent for this phase:

- outbound integrations must be handled via local adapters
- retry/timeout must live inside adapter implementations
- duplication between payment and notification adapters is acceptable

Implementation style required:

- local adapter-level changes only
- simple inline retry loop inside adapter methods
- direct timeout values in adapter request config
- lightweight implementation; avoid framework abstractions

STRICTLY FORBIDDEN:

- `RetryService`
- `ResilienceModule`
- shared retry framework/helpers across services
- decorators/interceptors
- RxJS retry pipelines
- policy engines
- circuit breakers
- fallback orchestration
- enterprise resilience platform concepts

Implementation Rules:

1. Inspect existing outbound payment/notification call points in `booking-service`.
2. Ensure calls are routed through local adapters:
   - `PaymentProviderAdapter`
   - `NotificationProviderAdapter`
3. Implement retry + timeout inside each adapter implementation method.
4. Keep logic local and explicit (no shared resilience utilities required).
5. Use max 3 attempts and backoff `1s -> 2s -> 4s`.
6. Retry only timeout/network transient/HTTP `5xx`; fail fast on `4xx`.
7. Keep service-layer changes minimal: call adapter, map result, handle final error.
8. Use existing logger context only.
9. Add focused tests for retry classification, retry limit, and timeout behavior.
10. Do not modify anything outside `booking-service`.

Success Criteria:

- outbound calls isolated behind local payment/notification adapters
- bounded retries and bounded timeout enforced locally
- no shared resilience framework or modules
- no architecture expansion beyond `booking-service`
