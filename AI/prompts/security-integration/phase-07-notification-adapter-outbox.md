# Phase 07 - Notification Adapter & Async Outbox Isolation

## Objective

Isolate notification provider failures from core transaction path using adapter abstraction and async outbox processing, with PII-safe event storage and consumer-side deduplication.

## Non-Goals

- Do NOT block booking confirmation on notification success.
- Do NOT merge notification retries into payment callback path.
- Do NOT implement SMS/email template rendering engine.

## Operational Semantics

- Booking flow commits first, notification dispatch async later.
- Notification retry is bounded and independent from booking transaction.
- Failed notification enters triage queue; booking remains valid.
- Outbox events containing PII must be encrypted at rest or redacted after delivery.
- Consumer must deduplicate to prevent sending same notification twice.

## Scope

- Services affected:
  - `booking-service`
  - notification worker service/module
- Modules affected:
  - notification adapter interface + providers
  - outbox publisher (within booking transaction)
  - outbox consumer (worker)
  - retry/failure handling
  - PII redaction/encryption layer
- Configs affected:
  - notification provider credentials (runtime-injected)
  - outbox poll interval and batch size
  - PII retention TTL

## Prerequisites

- `phase-02-rbac-ownership-enforcement.md`
- TEAM_TASK_DIVISION 2.5

## Tasks

- Implement `NotificationAdapter` abstraction (email, SMS, push as provider variants).
- Create async outbox event for booking-confirmed notifications:
  - outbox record written within same DB transaction as booking state change
  - outbox schema: `id`, `idempotency_key`, `event_type`, `payload` (encrypted), `status`, `attempts`, `created_at`, `processed_at`
- Define **consumer-side idempotency key**: `{booking_id}:{event_type}:{version}`.
  - consumer checks idempotency key before dispatching to provider
  - duplicate events are marked `SKIPPED` with audit log, not reprocessed
- Add provider retry policy (3 attempts: 1s/2s/4s exponential backoff).
- Mark exhausted events as `DEAD_LETTER` for manual follow-up without business rollback.
- Implement **PII handling**:
  - encrypt `payload` field using AES-256-GCM with key from `ConfigService`
  - after successful delivery, redact PII fields from outbox record (retain only metadata)
  - outbox records older than `OUTBOX_PII_RETENTION_DAYS` (default 30) are purged by scheduled job

## Expected Deliverables

- notification adapter module with provider implementations
- outbox publisher + consumer with idempotency guard
- PII encryption/redaction utilities
- retry + dead-letter handling tests
- outbox purge scheduled job

## Acceptance Criteria

- Booking confirmation API response is not delayed by notification provider outage.
- Retries are bounded and observable.
- Failed notification does not revert confirmed booking.
- Duplicate outbox events (same idempotency key) are not dispatched twice.
- Outbox payload is encrypted at rest; PII is redacted after successful delivery.
- Outbox records beyond retention TTL are automatically purged.

## Validation Steps

- Provider 503 simulation with eventual success on 2nd retry.
- Provider hard-down simulation with dead-letter capture after 3 attempts.
- Insert duplicate outbox event with same idempotency key → verify single dispatch.
- Verify outbox payload is AES-encrypted in DB, not plaintext.
- Verify PII fields are redacted after delivery confirmation.

## Test Plan

- Unit: adapter response mapping, idempotency key generation, encryption/decryption round-trip
- Unit: PII redaction utility (before/after payload comparison)
- Integration: outbox -> consumer -> provider -> status update
- Integration: duplicate event dedup flow
- Failure: retry exhaustion -> dead-letter transition
- Scheduled: purge job removes records beyond retention TTL

## Risks

- Hidden coupling causing booking rollback on notification error.
- Duplicate notifications from retry race conditions (mitigated by idempotency key).
- Encryption key rotation causing decryption failures for in-flight events.
- Outbox table growth if purge job fails silently.

## Rollback Strategy

- Disable async worker path.
- Revert adapter/outbox integration changes.
- Outbox records remain encrypted; decryption key must be preserved until fully drained.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.5

# Agent Implementation Prompt

Implement ONLY Phase 07.

FORBIDDEN:
- Synchronous notification send inside booking transaction.
- Unlimited retries.
- Storing PII in plaintext in outbox table.
- Dispatching notification without checking idempotency key first.

Strict Rules:
1. Outbox pattern must preserve at-least-once delivery with idempotent consumer behavior.
2. Notification failures are non-blocking for booking finalization.
3. Add tests for retry, dead-letter, and dedup paths.
4. Consumer idempotency key = `{booking_id}:{event_type}:{version}`.
5. PII encryption key loaded from `ConfigService`, never hardcoded.
6. Outbox purge job must respect `OUTBOX_PII_RETENTION_DAYS` config.
