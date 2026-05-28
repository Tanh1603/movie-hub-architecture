# Phase 08 - Sensitive Data, Transport Security & Secrets Hygiene

## Objective

Enforce strict sensitive-data controls, TLS requirements for public traffic, inter-service transport security for internal traffic, and secret hygiene across gateway and services.

## Non-Goals

- Do NOT implement new business endpoints.
- Do NOT alter payment state machine logic.
- Do NOT introduce mTLS between microservices (defer to infra team if needed later).

## Operational Semantics

- Sensitive fields are redacted before logging.
- Public traffic uses TLS policy (minimum TLS 1.2).
- Inter-service TCP transport is restricted to private network only — no public exposure.
- Secrets are runtime-injected and never committed to source.
- Secret rotation is automated with health-check verification.

## Scope

- Services affected:
  - all backend services
  - `api-gateway`
- Modules affected:
  - error filter / log redaction
  - config loader / secret reader
  - inter-service network policy
- Infra/manifests affected:
  - TLS and secret config manifests
  - Docker Compose / Kubernetes network policies
  - Firewall rules for TCP service ports

## Prerequisites

- TEAM_TASK_DIVISION 2.6

## Tasks

- Implement centralized **log redaction** for tokens/secrets/payment-sensitive fields:
  - redaction utility with deny-by-default allowlist approach
  - fields to redact: `authorization`, `x-api-key`, `password`, `cardNumber`, `cvv`, `pin`, `refreshToken`, `accessToken`
  - apply redaction in `LoggingInterceptor` and `GlobalExceptionFilter`
  - preserve `correlationId`, `userId`, `path`, `method`, `statusCode` for traceability
- Enforce generic client error responses for security-sensitive failures:
  - no stack traces, internal IPs, database names, or service topology in responses
  - internal error details logged server-side only with correlation ID
- Validate TLS enforcement policies:
  - API Gateway enforces TLS 1.2+ for all public endpoints
  - HSTS header with `max-age=31536000; includeSubDomains`
  - redirect HTTP → HTTPS at load balancer / reverse proxy level
- Implement **inter-service transport security policy**:
  - NestJS TCP transport is plaintext by default — **do NOT expose TCP ports to public network**
  - Docker Compose: TCP service ports bound to internal network only (`expose` not `ports`)
  - Document network boundary assumption: all inter-service TCP traffic MUST stay within VPC/private network
  - Add startup health-check that verifies TCP ports are NOT publicly reachable (optional, staging/CI only)
  - If production requires cross-network communication, escalate to infra team for mTLS evaluation
- Document and automate **secret rotation**:
  - define rotation cadence per secret type:
    - Clerk keys: 90 days
    - Payment provider secrets: 90 days
    - JWT signing keys (if custom): 30 days
    - Database credentials: 180 days
  - implement `/internal/health/secrets` endpoint (internal-only) that reports secret age warnings
  - emergency rotation runbook: steps to rotate + restart without downtime
  - CI check: fail build if `.env` files or hardcoded secrets detected in source (`git-secrets` or equivalent)

## Expected Deliverables

- Redaction middleware/filter with comprehensive field coverage
- Transport + secret policy documentation
- Inter-service network policy (Docker Compose + K8s manifest updates)
- Secret age health-check endpoint
- CI secret scanning integration
- Security test cases for leakage prevention

## Acceptance Criteria

- No sensitive data appears in application logs (verified by redaction tests).
- Client-facing errors contain no stack traces/internal topology.
- TLS policy is verifiably enforced for production paths.
- TCP service ports are NOT exposed in Docker `ports` — only `expose` (internal).
- `/internal/health/secrets` reports age of each managed secret.
- CI pipeline fails if hardcoded secrets are detected in source code.

## Validation Steps

- Run secret-scanning on logs and response payload samples.
- Probe insecure transport (HTTP) and verify redirect/reject behavior.
- From outside Docker network, attempt to connect to TCP service ports — must fail.
- Verify HSTS header present on all HTTPS responses.
- Seed a `.env` file into source and verify CI blocks merge.

## Test Plan

- Unit: redaction utility (token, card, password patterns)
- Unit: redaction preserves non-sensitive fields (correlationId, path, method)
- Integration: error response sanitization (no stack traces in 500 responses)
- Integration: HSTS header verification
- Operational: secret rotation rehearsal in staging
- CI: git-secrets scan catches hardcoded credentials

## Risks

- False negatives in redaction patterns (custom fields not in allowlist).
- Breaking diagnostics if over-redacted without internal trace IDs.
- Developers accidentally adding `ports` instead of `expose` in Docker Compose.
- Secret rotation causing brief outage if not coordinated.

## Rollback Strategy

- Revert redaction filter changes if blocking operations.
- Keep prior secure logging baseline and patch iteratively.
- Revert Docker Compose network changes if breaking service discovery.

## Architecture Alignment

- TEAM_TASK_DIVISION 2.6
- ADD security data-protection requirements
- SAD inter-service trust boundary decisions

# Agent Implementation Prompt

Implement ONLY Phase 08.

FORBIDDEN:
- Logging raw credentials or payment payloads.
- Returning internal stack traces to clients.
- Exposing TCP service ports via Docker `ports` directive.
- Hardcoding secrets in source code or config files committed to git.

Strict Rules:
1. Redaction defaults to deny-by-default for sensitive fields.
2. Preserve operational traceability via correlation ID.
3. Separate internal diagnostics from external responses.
4. Inter-service TCP traffic MUST stay within private network boundary.
5. Secret age health-check is internal-only — never expose on public routes.
6. CI must block merges with detected hardcoded secrets.
