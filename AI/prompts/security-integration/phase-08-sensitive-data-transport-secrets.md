# Phase 08 - Sensitive Data, Transport Security & Secrets Hygiene

## Objective

Enforce strict sensitive-data controls, TLS requirements, and secret hygiene across gateway and services.

## Non-Goals

- Do NOT implement new business endpoints.
- Do NOT alter payment state machine logic.

## Operational Semantics

- Sensitive fields are redacted before logging.
- Public and service traffic uses TLS policy (minimum TLS 1.2).
- Secrets are runtime-injected and never committed to source.

## Scope

- Services affected:
  - all backend services
  - `api-gateway`
- Modules affected:
  - error filter / log redaction
  - config loader / secret reader
- Infra/manifests affected:
  - TLS and secret config manifests

## Prerequisites

- TEAM_TASK_DIVISION 2.6

## Tasks

- Implement centralized log redaction for tokens/secrets/payment-sensitive fields.
- Enforce generic client error responses for security-sensitive failures.
- Validate TLS enforcement policies and redirect from insecure transport where applicable.
- Document secret rotation cadence and emergency rotation steps.

## Expected Deliverables

- redaction middleware/filter
- transport + secret policy docs/config updates
- security test cases for leakage prevention

## Acceptance Criteria

- No sensitive data appears in application logs.
- Client-facing errors contain no stack traces/internal topology.
- TLS policy is verifiably enforced for production paths.

## Validation Steps

- Run secret-scanning on logs and response payload samples.
- Probe insecure transport and verify policy behavior.

## Test Plan

- Unit: redaction utility
- Integration: error response sanitization
- Operational: secret rotation rehearsal in staging

## Risks

- False negatives in redaction patterns.
- Breaking diagnostics if over-redacted without internal trace IDs.

## Rollback Strategy

- Revert redaction filter changes if blocking operations.
- Keep prior secure logging baseline and patch iteratively.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.6
- ADD security data-protection requirements

# Agent Implementation Prompt

Implement ONLY Phase 08.

FORBIDDEN:
- Logging raw credentials or payment payloads.
- Returning internal stack traces to clients.

Strict Rules:
1. Redaction defaults to deny-by-default for sensitive fields.
2. Preserve operational traceability via correlation ID.
3. Separate internal diagnostics from external responses.
