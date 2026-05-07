# MovieHub: 3-Member Team Task Division

## Quality Attribute Implementation Strategy

**Date**: May 5, 2026  
**Focus Quality Attributes**: Availability, Security, Performance, Maintainability, Logging, Backup & Restoration

---

## Executive Summary

This document proposes a task division for a 3-member development team responsible for implementing critical quality attributes across MovieHub. Rather than assigning work by isolated quality attributes, **responsibilities are grouped by architectural layers and concerns**, ensuring cohesive ownership and minimal cross-team dependency.

### Division Principle

- **Member 1 (A)**: Infrastructure & Reliability Lead — system uptime, failover, health, backup/restore
- **Member 2 (B)**: Security & Integration Lead — authentication, external integrations, payment safety
- **Member 3 (C)**: Core Transaction & Observability Lead — booking logic, seat management, logging, performance

Each member owns a **vertically-integrated slice** of the system that naturally touches multiple quality attributes but stays bounded within coherent architectural concerns.

---

## Team Member 1: Infrastructure & Reliability Lead

### Overview

Owns all infrastructure-level concerns: deployment topology, health management, failover orchestration, instance scaling, backup/restore procedures, and operational continuity.

### Primary Responsibilities

#### 1.1 Infrastructure & Health Management

**Quality Attributes**: Availability (99.9% uptime), Reliability (no data loss)

**Responsibilities**:

- Design and implement health check endpoints (`/health/live`, `/health/ready`) for all services
- Establish health check intervals (≤10s), timeouts (≤2s), and response criteria
- Configure readiness probe dependencies: Redis, PostgreSQL, external provider reachability
- Implement rapid failure detection (≤10s) and instance removal from load balancer (≤30s)

**Affected Artifacts**:

- API Gateway health endpoints
- Booking Service health endpoints
- All backend service health checks
- Load balancer configuration (Kubernetes or Azure Container Apps)
- Health probe configuration manifests

**Concrete Implementation Tasks**:

1. Create a shared `HealthCheckModule` in NestJS that combines:
   - Redis connection check
   - PostgreSQL connection check
   - External provider reachability probe (with short timeout)
2. Expose `/health/live` (liveness: is the process running?)
3. Expose `/health/ready` (readiness: can this instance serve traffic?)
4. Implement failure thresholds: fail the probe after 2 consecutive failures
5. Configure Kubernetes/Container Apps:
   - Health check interval: every 10 seconds
   - Timeout: 2 seconds
   - Unhealthy threshold: 2 consecutive failures
   - Remove from service after unhealthy
6. Test health check behavior under Redis outage, DB disconnection, and provider timeout

---

#### 1.2 Failover & Load Balancing Strategy

**Quality Attributes**: Availability (failover ≤5s), Reliability (no request loss)

**Responsibilities**:

- Design multi-instance deployment topology with minimum 2 replicas per user-facing service
- Establish connection draining and graceful shutdown procedures
- Implement circuit breaker concepts for external provider calls
- Define deployment update strategy (rolling update, blue-green, canary)

**Affected Artifacts**:

- Deployment manifests (Kubernetes or Azure Container Apps)
- API Gateway replica configuration
- Booking Service replica configuration
- Load balancer routing rules
- Graceful shutdown hooks in NestJS applications
- Service restart and rollback procedures

**Concrete Implementation Tasks**:

1. Configure deployment manifests with:
   - Minimum 2 replicas for API Gateway, Booking Service, all backend services
   - Pod disruption budgets (PDB) to prevent simultaneous eviction
   - Resource requests/limits to prevent starvation
2. Implement graceful shutdown in NestJS:
   - Listen to SIGTERM and drain existing connections
   - Stop accepting new requests after signal
   - Wait up to 30s for in-flight requests to complete
   - Close database connections cleanly
3. Configure load balancer to:
   - Drain connections over 10s when removing an unhealthy instance
   - Re-route in-flight requests to healthy replicas
   - Track session affinity (if needed) without forcing single-instance dependencies
4. Define rolling update procedure:
   - Update 1 replica at a time
   - Verify health before moving to next replica
   - Monitor metrics during update (latency, error rate)
5. Implement deployment validation:
   - Smoke tests after each replica update
   - Automated rollback if error rate exceeds threshold
6. Test failover scenarios:
   - Kill one pod mid-request
   - Verify request completes on another replica
   - Measure failover latency (target: ≤5s user-visible interruption)

---

#### 1.3 Distributed Retry & Timeout Strategy

**Quality Attributes**: Availability (external dependency resilience), Reliability (bounded failures)

**Responsibilities**:

- Define bounded retry policy for external dependencies (3 attempts, 1s/2s/4s backoff)
- Establish timeout budgets per service call (payment: 30s max, internal: 10s default)
- Implement retry-aware request identification and idempotency support

**Affected Artifacts**:

- External provider integration layer (payment, notification, Clerk)
- Internal service-to-service call configuration
- Request timeout settings in NestJS/HTTP client
- Retry policy enforcement middleware

**Concrete Implementation Tasks**:

1. Create a shared `RetryPolicy` configuration:
   - Max attempts: 3
   - Backoff strategy: exponential (1s, 2s, 4s) = 7s total
   - Transient error classification (5xx, timeout, connection reset)
   - Non-retryable: 4xx (except 429), 401/403
2. Implement retryable HTTP client wrapper:
   - Automatically retry on transient failures
   - Use exponential backoff with jitter to avoid thundering herd
   - Track retry count in logs and headers
3. Define timeout budgets per call type:
   - External provider calls (payment, notification): 30s max
   - Internal service calls: 10s default (per service agreement)
   - Health checks: 2s timeout (fail-fast)
4. Implement request-scoped retry tracking:
   - Add `x-retry-count` header to downstream calls
   - Log retry attempts with correlation ID
   - Mark final failure with attempt exhaustion message
5. Configure external provider boundaries:
   - Payment Gateway adapter enforces 30s timeout and 3 retries
   - Notification adapter enforces 15s timeout and 3 retries
   - Clerk adapter enforces 10s timeout and 2 retries (to fail fast on auth)
6. Test retry behavior:
   - Simulate provider 503 response → verify retry happens
   - Simulate provider timeout → verify circuit-breaker degradation
   - Simulate provider slow response (25s) → verify within budget

---

#### 1.4 Backup & Restoration Procedures

**Quality Attributes**: Reliability (no data loss), Maintainability (recovery clarity)

**Responsibilities**:

- Design backup frequency, retention, and point-in-time recovery strategy
- Define restore order and validation procedures
- Implement post-restore consistency checks
- Document disaster recovery runbooks

**Affected Artifacts**:

- PostgreSQL backup configuration (snapshots, WAL archiving)
- Backup storage and lifecycle policies
- Restore automation scripts
- Recovery runbooks and checklists
- Post-restore validation procedures
- Service restart sequencing after restore

**Concrete Implementation Tasks**:

1. Backup Strategy:
   - **Booking DB**: Full snapshots every 15 minutes (because it holds booking, payment, ticket, outbox state)
   - **Other Service DBs**: Full snapshots every 60 minutes
   - **WAL (Write-Ahead Log)**: Archive continuously for point-in-time recovery
   - **Retention**: Daily snapshots for 7 days, weekly for 4 weeks, monthly for 6 months
2. Backup Configuration:
   - Enable PostgreSQL `archive_mode` and WAL archiving to object storage
   - Configure automated snapshot creation on schedule
   - Test backup integrity weekly (restore to staging, verify row counts)
3. Restore Procedure (with explicit order):
   - Step 1: Restore Booking DB first (authoritative booking, payment, ticket, outbox state)
   - Step 2: Restore Cinema Service DB (showtime and seat structure)
   - Step 3: Restore Movie Service DB (catalog data, less critical)
   - Step 4: Restore User Service DB (user profiles and roles)
   - Step 5: Validate schema and record counts against baseline
   - Step 6: Run consistency checks (see below)
   - Step 7: Re-enable external integrations (payment callbacks, notifications)
4. Post-Restore Validation Script:
   - Verify Booking DB schema matches expected version
   - Spot-check booking records: verify counts across statuses (PENDING, CONFIRMED, CANCELLED)
   - Verify payment state: check that every booking has a payment record
   - Verify ticket state: check that every CONFIRMED booking has corresponding tickets
   - Verify outbox records: count PENDING events and flag if suspicious
   - Checksum sampling: randomly verify 10% of booking-payment-ticket triplets for correctness
   - Abort restore if any validation fails; escalate to manual review
5. Outbox Replay Rules After Restore:
   - Identify outbox records in PENDING or UNSENT state
   - Do NOT replay records marked as DELIVERED or FAILED
   - Replay pending notification and payment webhook events
   - Use idempotency keys to prevent duplicate processing
   - Log replay activity with correlation ID for traceability
6. Disaster Recovery Runbooks:
   - Create step-by-step procedure for: "Database Corruption Detected"
   - Create step-by-step procedure for: "Regional Outage — Failover to Secondary"
   - Create step-by-step procedure for: "Partial Data Loss — Point-in-Time Restore"
   - Include timing estimates and success criteria for each step
7. Test Recovery Procedures:
   - Monthly: conduct full restore-to-staging and validation
   - Measure restore time and validation time
   - Document any inconsistencies discovered and fixes applied
   - Update runbooks based on lessons learned

---

#### 1.5 Monitoring & Alerting Configuration

**Quality Attributes**: Availability (rapid detection), Reliability (incident response)

**Responsibilities**:

- Define SLO metrics and alert thresholds for critical flows
- Configure alerting for health check failures, error spikes, latency degradation
- Establish on-call procedures and escalation

**Affected Artifacts**:

- Observability configuration (monitoring, alerting)
- Alert rules and thresholds
- SLO dashboards
- Incident response procedures

**Concrete Implementation Tasks**:

1. Define SLO Metrics:
   - Availability: 99.9% uptime per month (allow 43.2 minutes downtime)
   - Error rate: <0.1% of requests should fail
   - P95 latency: booking path ≤3s, browse ≤2s, seat feedback ≤500ms
2. Configure Alerts:
   - Health check failure on 2 consecutive probes → page on-call
   - Error rate exceeds 1% for 5 minutes → page on-call
   - P95 latency exceeds 5s for 10 minutes → page on-call (warning)
   - Redis unavailable → page on-call immediately
   - PostgreSQL unavailable → page on-call immediately
3. Create Observability Dashboard:
   - Current replica count and health status per service
   - Request volume and error rate over time
   - Latency percentiles (p50, p95, p99)
   - External provider response time and error rates
   - Database connection pool utilization
4. Incident Response Procedure:
   - Alert fires → auto-page on-call engineer
   - Engineer checks dashboard and logs
   - If transient, check if auto-remediation (restart pod) resolves
   - If persistent, escalate to team lead or full team
   - Document incident and post-mortem findings

---

### Summary: Member 1 Deliverables

| Responsibility        | Concrete Deliverables                                       | Timeline | Dependencies        |
| --------------------- | ----------------------------------------------------------- | -------- | ------------------- |
| Health Management     | Health check module, probe config, test scenarios           | Week 1-2 | NestJS setup        |
| Failover Strategy     | Deployment manifests, graceful shutdown, update procedure   | Week 2-3 | Infra access        |
| Retry & Timeout       | Shared retry policy module, HTTP client wrapper             | Week 1   | None                |
| Backup & Restore      | Backup config, restore scripts, validation checks, runbooks | Week 3-4 | DB access           |
| Monitoring & Alerting | Alert rules, dashboards, incident procedures                | Week 2-3 | Observability stack |

---

## Team Member 2: Security & Integration Lead

### Overview

Owns all authentication, authorization, external integration concerns, and secure data handling. Includes payment gateway integration, notification provider adapters, identity delegation, and callback security.

### Primary Responsibilities

#### 2.1 Authentication & Token Validation

**Quality Attributes**: Security (credential protection, session integrity), Performance (fast validation ≤50ms)

**Responsibilities**:

- Integrate with Clerk for identity verification and session management
- Implement JWT/session token validation at API Gateway and service boundaries
- Enforce authentication on all protected endpoints
- Prevent brute-force attacks and session replay

**Affected Artifacts**:

- API Gateway authentication middleware
- Clerk integration layer
- JWT/token validation guards in NestJS
- Token caching strategy
- Brute-force detection configuration

**Concrete Implementation Tasks**:

1. API Gateway Authentication Flow:
   - Intercept all requests at the gateway
   - Extract JWT from Authorization header or session cookie
   - Validate token signature using Clerk's public keys (cached, refresh hourly)
   - Check expiration, issuer (must be Clerk), and audience
   - Extract user ID and role from token claims
   - Attach user context to request headers for downstream services
   - Return 401 if token missing or invalid (never expose whether username exists)
2. Create `AuthGuard` for NestJS:
   - Read `x-user-id` and `x-user-role` from request headers (set by gateway)
   - Validate user ID format and role membership
   - Throw ForbiddenException if headers missing (defense in depth)
3. Implement Brute-Force Protection:
   - Track failed login attempts per account and per IP using Redis
   - Threshold: 5 failed attempts → temporary lockout
   - Lockout duration: 5 minutes, then reset counter
   - Log attempts with IP, timestamp, and correlation ID
4. Token Validation Performance:
   - Cache Clerk public keys in Redis with 1-hour TTL
   - Validate token locally using cached key (≤10ms)
   - If local validation fails, fetch fresh key from Clerk (longer, but rare)
   - Measure validation latency in logs; target ≤50ms per request
5. Session Management:
   - Delegate session creation entirely to Clerk
   - Do not create custom session tokens internally
   - Use Clerk's refresh token mechanism for token refresh
6. Test Scenarios:
   - Valid JWT → passes validation and attaches user context
   - Expired JWT → returns 401
   - Invalid signature → returns 401
   - Missing authorization header → returns 401
   - Brute-force 6 login attempts → 6th attempt triggers lockout
   - Lockout release after 5 minutes → next attempt succeeds

---

#### 2.2 Authorization & Access Control

**Quality Attributes**: Security (privilege enforcement, data ownership), Performance (fast checks ≤100ms)

**Responsibilities**:

- Implement role-based access control (RBAC) with clear role definitions
- Enforce data ownership checks (customer can only access own bookings, etc.)
- Protect sensitive operations with elevated permission checks
- Audit authorization failures

**Affected Artifacts**:

- NestJS guards for role-based authorization
- Data ownership validation in service methods
- Role definitions and permissions matrix
- Authorization failure logging

**Concrete Implementation Tasks**:

1. Define Role Hierarchy:
   - `CUSTOMER`: Can browse, hold seats, create bookings, view own bookings/tickets
   - `STAFF`: Can manage showtimes, view cinema-specific bookings
   - `CINEMA_MANAGER`: Can manage cinema schedule, view cinema analytics
   - `ADMIN`: Full system access
2. Create `RoleGuard` for NestJS:
   - Extract role from request headers (set by auth middleware)
   - Compare against required roles for the endpoint
   - Throw ForbiddenException if role insufficient
   - Log authorization check outcome (success/failure) with user ID and action
3. Implement Data Ownership Checks:
   - Customer booking retrieval: verify `userId == currentUserId` before returning
   - Customer cancellation: verify `userId == currentUserId` before allowing
   - Ticket validation: verify ticket belongs to user making request or is admin
   - Refund request: verify booking ownership before processing
4. Protect Sensitive Operations:
   - Payment initiation: require active CUSTOMER role
   - Refund approval: require ADMIN role
   - Showtime modification: require STAFF or ADMIN role
   - Admin panel access: require ADMIN role with secondary confirmation for sensitive actions
5. Authorization Response:
   - Unauthorized requests (missing role): return 403 with generic message
   - Data access denied (ownership check fails): return 404 (not found) instead of 403
     - Rationale: Avoid revealing whether resource exists
   - Log all authorization failures with: user ID, attempted action, target resource, correlation ID
6. Test Scenarios:
   - Customer role accessing their own booking → success
   - Customer role accessing another user's booking → 404
   - Staff role accessing non-assigned cinema → 403
   - ADMIN role accessing sensitive endpoint → success
   - Invalid role claim → 403

---

#### 2.3 Payment Gateway Integration & Security

**Quality Attributes**: Security (payment safety, callback validation), Interoperability (provider independence)

**Responsibilities**:

- Design payment adapter layer that isolates provider-specific logic
- Implement secure payment initiation with idempotency keys
- Validate and authenticate payment callbacks with provider signatures
- Handle payment state transitions and reconciliation

**Affected Artifacts**:

- Payment adapter interface and provider implementations (VNPay, etc.)
- Payment state model and repository
- Callback validation middleware
- Idempotency key storage and enforcement
- Payment reconciliation procedures

**Concrete Implementation Tasks**:

1. Payment Adapter Architecture:
   - Create `PaymentAdapter` interface:
     ```
     interface PaymentAdapter {
       initiatePayment(amount, currency, bookingId, idempotencyKey): PaymentInitiationResult
       validateCallback(callbackData, signature): CallbackValidationResult
       refund(transactionId): RefundResult
     }
     ```
   - Implement provider-specific adapters: `VNPayAdapter`, `StripeAdapter` (as needed)
   - All provider-specific logic stays inside adapter; Booking Core only knows canonical model
2. Payment Initiation Flow:
   - Generate idempotency key: `{bookingId}-{timestamp}` (store in DB)
   - Check for duplicate request: if idempotency key exists, return previous result
   - Create payment request to provider with:
     - Amount, currency, booking ID, user email
     - Callback URL (signed so provider can verify it's from MovieHub)
     - Idempotency key (provider-specific if supported)
   - Return payment redirect URL or checkout session to client
   - Timeout: 30 seconds max for provider response
3. Callback Validation & Security:
   - Verify signature: decode callback and validate HMAC using provider secret
   - If signature invalid: return 200 (acknowledge receipt) but do NOT process
   - Log failed signature validation: suspicious activity
   - Parse callback into canonical payment status: PENDING, SUCCESS, FAILED, EXPIRED
   - Load current payment record from DB
   - Only apply transition if current state is PENDING or PROCESSING (prevents re-applying old callbacks)
4. Callback Idempotency:
   - Store callback transaction ID in database
   - Check if already processed: if yes, return 200 and skip processing
   - Mark callback as processed AFTER business action completes
   - Rationale: allows safe replay of failed processing
5. Secure Storage of Payment Secrets:
   - Store provider API keys in deployment secret store (never in source code)
   - Read secrets on service startup
   - Do not log or expose secrets anywhere
   - Rotate secrets quarterly
6. Payment State Reconciliation:
   - Implement periodic job: check for payments stuck in PROCESSING after 15 min
   - Query provider API to get current status (with provider-specific mechanism)
   - If provider indicates completion, update local state
   - If provider has no record, mark as TIMEOUT_NO_RESPONSE
7. Test Scenarios:
   - Valid payment initiation → returns redirect URL, stores idempotency key
   - Duplicate payment request (same idempotency key) → returns same redirect URL
   - Payment success callback with valid signature → updates payment to SUCCESS, marks booking CONFIRMED
   - Payment success callback with invalid signature → logged as suspicious, state unchanged
   - Duplicate success callback → second callback ignored, booking remains CONFIRMED
   - Callback timeout (no response from provider after 30s) → booking stays PENDING, retry later

---

#### 2.4 Callback Security & Webhook Handling

**Quality Attributes**: Security (replay prevention, tampering detection), Reliability (exactly-once processing)

**Responsibilities**:

- Implement webhook receiver with provider authentication
- Prevent replay and duplicate-callback attacks
- Ensure exactly-once semantic for payment callbacks
- Handle late-arriving or out-of-order callbacks

**Affected Artifacts**:

- Webhook receiver endpoint in API Gateway or Booking Service
- Callback validation middleware
- Callback deduplication logic (using transaction ID)
- Callback state machine transitions

**Concrete Implementation Tasks**:

1. Webhook Receiver Endpoint:
   - Create POST `/webhooks/payment/{provider}` endpoint
   - Accept webhook payload (different format per provider)
   - First action: validate signature (see section 2.3)
   - Reject unsigned or invalid callbacks immediately (no state change)
2. Callback Deduplication:
   - Extract transaction ID from callback (provider-specific)
   - Store transaction IDs of processed callbacks in Redis or database
   - Before processing: check if transaction ID already processed
   - If duplicate: return 200 (acknowledge to provider) but skip business logic
   - If new: process and store transaction ID
3. State Machine for Payment Processing:
   - Current state: PENDING_PAYMENT
   - Callback arrives with status SUCCESS:
     - Verify signature ✓
     - Check current state = PENDING ✓
     - Transition to PAYMENT_SUCCESS
     - Trigger booking confirmation and ticket issuance
   - Callback arrives with status FAILED:
     - Verify signature ✓
     - Check current state ≠ PAYMENT_SUCCESS (already confirmed)
     - Transition to PAYMENT_FAILED
     - Release held seats
   - Callback arrives with status CANCELLED or EXPIRED:
     - Verify signature ✓
     - Release held seats if still held
4. Callback Ordering & Late Arrival:
   - Store callback timestamp for reconciliation
   - If older callback arrives after newer one: log warning but do not reprocess
   - If newer callback contradicts older: use canonical state from database, not callback
5. Webhook Acknowledgment:
   - Always return 200 OK to provider (even if callback is duplicate or invalid)
   - Never expose error details to provider
   - Store all callbacks (including invalid/duplicate) in audit log with full context
6. Test Scenarios:
   - Valid success callback → booking confirmed, ticket issued
   - Success callback sent twice → first processes, second returns 200 but no state change
   - Late failure callback (arrives after success) → ignored, booking stays confirmed
   - Callback with missing signature → returns 200 but not processed (logged as suspicious)
   - Callback timeout to provider (never arrives) → booking stays PENDING, reconciliation job finds it after 15 min

---

#### 2.5 Notification Provider Integration

**Quality Attributes**: Interoperability (provider abstraction), Maintainability (adapter pattern)

**Responsibilities**:

- Abstract notification delivery behind provider adapters
- Isolate notification failure from booking critical path
- Implement retry and fallback strategies

**Affected Artifacts**:

- Notification adapter interface
- Provider-specific adapters (email, SMS providers)
- Notification outbox processing
- Retry and fallback logic

**Concrete Implementation Tasks**:

1. Notification Adapter Pattern:
   ```
   interface NotificationAdapter {
     sendEmail(to, subject, body, context): NotificationResult
     sendSMS(phoneNumber, message): NotificationResult
     verifyDelivery(messageId): DeliveryStatus
   }
   ```

   - Concrete implementations: EmailProviderAdapter, SMSProviderAdapter
   - All provider-specific retries stay inside adapter
2. Asynchronous Dispatch:
   - When booking confirmed, create notification event in outbox table
   - Async worker polls outbox and calls notification adapter
   - Do NOT block booking API response on notification delivery
3. Retry Strategy:
   - Adapter retries on transient failures (5xx, timeout)
   - Max 3 attempts with exponential backoff (1s, 2s, 4s)
   - If all retries fail, log event and mark for manual review (not critical)
4. Test Scenarios:
   - Booking confirmed → notification event persisted in outbox
   - Async worker processes event → calls notification adapter
   - Provider returns 503 → worker retries, eventually succeeds
   - Provider unavailable → max retries exhausted, event marked as failed (booking still confirmed)

---

#### 2.6 Sensitive Data Handling & Encryption

**Quality Attributes**: Security (data protection, compliance)

**Responsibilities**:

- Ensure payment data is never stored internally
- Encrypt sensitive data in transit (HTTPS/TLS)
- Prevent secret leakage in logs or error responses

**Affected Artifacts**:

- HTTPS/TLS configuration
- Payment data handling procedures
- Error response filtering
- Secret storage and rotation

**Concrete Implementation Tasks**:

1. HTTPS/TLS Enforcement:
   - All public-facing endpoints require HTTPS/TLS
   - Set minimum TLS 1.2
   - Disable insecure protocols (HTTP, SSLv3)
   - Configure certificate rotation (auto-renewal recommended)
2. Payment Data Handling:
   - NEVER store full card numbers, CVV, or PINs internally
   - NEVER transmit payment data through internal logs
   - Payment details stay entirely with provider (e.g., Stripe, VNPay)
   - Store only: payment status, transaction ID, amount, date
3. Error Response Filtering:
   - Do NOT expose stack traces or internal error details to clients
   - Return generic error message to user (e.g., "Payment processing failed. Please try again.")
   - Log full error details server-side with correlation ID
4. Test Scenarios:
   - Payment processing error → generic error returned to client, full details logged server-side
   - Logs do not contain payment card data, API keys, or secrets
   - All service-to-service communication over HTTPS

---

### Summary: Member 2 Deliverables

| Responsibility         | Concrete Deliverables                                                         | Timeline | Dependencies                |
| ---------------------- | ----------------------------------------------------------------------------- | -------- | --------------------------- |
| Authentication & Token | Auth middleware, JWT validation, Clerk integration, brute-force protection    | Week 1-2 | Clerk setup                 |
| Authorization & RBAC   | RoleGuard, data ownership checks, role matrix, audit logging                  | Week 1-2 | Auth completion             |
| Payment Integration    | Payment adapter, initiation flow, idempotency keys, state management          | Week 2-4 | Payment provider API access |
| Callback Security      | Webhook receiver, signature validation, deduplication, state machine          | Week 3-4 | Payment integration         |
| Notification Adapters  | Notification adapter interface, provider implementations, async dispatch      | Week 2-3 | Async infrastructure        |
| Data Security          | HTTPS/TLS config, secret management, error filtering, payment data procedures | Week 1   | Infra access                |

---

## Team Member 3: Core Transaction & Observability Lead

### Overview

Owns booking domain logic, seat management, comprehensive logging and tracing, performance optimization through caching, and transaction correctness.

### Primary Responsibilities

#### 3.1 Structured Logging & Correlation ID Propagation

**Quality Attributes**: Logging (account/event/method levels), Maintainability (forensic capability), Performance (structured over free-form)

**Responsibilities**:

- Implement structured JSON logging across all services
- Generate and propagate correlation IDs end-to-end
- Enforce account-level, event-level, and method-level logging standards
- Enable post-incident analysis and real-time debugging

**Affected Artifacts**:

- NestJS logging interceptors
- Correlation ID generation and propagation middleware
- Structured log schema and format
- Log indexing and querying infrastructure

**Concrete Implementation Tasks**:

1. Create Shared Logging Module:
   ```typescript
   // Shared logging module in libs/shared-logging
   export interface StructuredLog {
     timestamp: string; // ISO 8601
     level: string; // info, warn, error
     service: string; // booking-service, api-gateway, etc.
     environment: string; // dev, staging, production
     correlationId: string; // Unique per user journey
     requestId: string; // Unique per HTTP request
     userId: string; // Actor performing action
     action: string; // booking.create, payment.callback.received, etc.
     entityType: string; // booking, payment, ticket, etc.
     entityId: string; // Primary record identifier
     message: string; // Human-readable summary
     durationMs: number; // Operation latency
     httpStatus: number; // HTTP response code (if applicable)
     errorCode: string; // Machine-readable error identifier
     metadata: Record<string, unknown>; // Additional context
   }
   ```
2. Correlation ID Generation & Propagation:
   - **At API Gateway**:
     - Generate `correlationId = uuid()` for every inbound request
     - Generate `requestId = uuid()` per HTTP request
     - Attach both to request context (`x-correlation-id`, `x-request-id` headers)
   - **In Service Handlers**:
     - Extract correlation ID from headers
     - Pass to all downstream service calls (via headers)
     - Pass to all async jobs and outbox events
   - **In Async Workers**:
     - Preserve original correlation ID when processing outbox events
     - Generate new `requestId` for retry attempt (but keep original `correlationId`)
   - **In WebSocket Handlers**:
     - Generate correlation ID per WebSocket session
     - Reuse for all messages on that session
3. Implement Logging Interceptor (NestJS):
   ```typescript
   @Injectable()
   export class LoggingInterceptor implements NestInterceptor {
     intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
       const request = context.switchToHttp().getRequest();
       const correlationId = request.headers['x-correlation-id'] || uuid();
       const userId = request.user?.id || 'anonymous';
       const startTime = Date.now();

       return next.handle().pipe(
         tap(() => {
           // On success: log with status 200, duration
         }),
         catchError((error) => {
           // On error: log with error code, status, message
         }),
       );
     }
   }
   ```
4. Logging Standards by Level:
   - **Account-level**: User actions with business significance
     - Events: login, logout, seat hold, booking confirmation, cancellation, refund request, ticket validation
     - Fields: userId, action, entityType, entityId, timestamp
     - Example: `"action": "booking.confirmed"` → user now owes money, ticket issued
   - **Event-level**: Domain state transitions and milestones
     - Events: payment callback received, payment confirmed, ticket issued, refund approved, notification sent
     - Fields: action, entityType, entityId, status, provider (if external)
     - Example: `"action": "payment.callback.received", "status": "SUCCESS"`
   - **Method-level**: Operational detail for debugging
     - Events: retry attempt, lock acquisition, validation failure, dependency call
     - Fields: action, duration, outcome, error code (if failure)
     - Example: `"action": "redis.lock.acquire", "durationMs": 12, "outcome": "success"`
5. Log Rotation & Retention:
   - Ship all logs to centralized observability stack (e.g., ELK, Datadog, Azure Monitor)
   - Keep last 30 days of logs in hot storage
   - Archive older logs to cold storage
   - Set up automated indexing for query: correlationId, userId, action, entityId
6. Test Logging:
   - Verify correlation ID flows from API Gateway → service → async worker
   - Verify account-level log created on booking confirmation
   - Verify event-level log created on payment callback
   - Verify method-level log created on retry attempt
   - Query logs by correlation ID and reconstruct full journey

---

#### 3.2 Booking Core Logic & State Management

**Quality Attributes**: Reliability (transactional correctness), Performance (minimal latency)

**Responsibilities**:

- Implement booking state machine with transactional guarantees
- Coordinate seat holds with timeout and expiry
- Ensure exactly-once booking confirmation per payment
- Support idempotent retries and cancellation

**Affected Artifacts**:

- Booking entity model and state transitions
- Booking repository (PostgreSQL access layer)
- Booking application service (orchestration)
- Seat hold manager (Redis + TTL)
- Outbox event recording

**Concrete Implementation Tasks**:

1. Booking State Machine:

   ```
   INITIAL
     ↓ (user holds seats)
   SEAT_HELD (TTL 5 min)
     ↓ (user initiates payment)
   PENDING_PAYMENT (TTL 15 min until payment completes or fails)
     ↓ (payment success callback received)
   CONFIRMED (seats locked, tickets issued)
     ↓ (user cancels and refund is processed)
   REFUNDED

   From SEAT_HELD or PENDING_PAYMENT:
     ↓ (hold expires or payment fails)
   CANCELLED (seats released)
   ```

2. Booking Entity & Repository:
   ```typescript
   interface Booking {
     id: string;
     userId: string;
     showtimeId: string;
     seatIds: string[]; // List of held seats
     status: BookingStatus; // SEAT_HELD, PENDING_PAYMENT, CONFIRMED, CANCELLED
     totalPrice: number;
     createdAt: Date;
     expiresAt: Date; // Seat hold expiry (5 min)
     paymentId: string;
     ticketIds: string[];
     correlationId: string;
     idempotencyKey: string;
   }
   ```

   - Repository: `BookingRepository.create()`, `BookingRepository.update()`, `BookingRepository.findById()`
   - All DB operations use transactional guarantees (ACID)
3. Booking Creation Flow:
   - **Input**: showtimeId, seatIds, userId, idempotencyKey (from client)
   - **Validation**:
     - Verify showtime exists and is bookable
     - Verify seats exist in showtime
     - Verify user is authenticated and not blocked
     - Check for duplicate idempotencyKey (if exists, return existing booking)
   - **Seat Hold**:
     - Attempt to acquire Redis lock for each seat with TTL=5min
     - If any lock fails (seat already held), reject immediately
     - Record seat locks in correlation ID context
   - **Write to DB**:
     - Create Booking record with status SEAT_HELD
     - Record hold expiry: now + 5 minutes
     - Create Outbox event: `booking.seat_held`
     - Perform in single transaction
   - **Response**:
     - Return booking ID and expiry time to client
     - Client proceeds to payment initiation within 5 minutes
4. Booking Confirmation (after payment success):
   - **Input**: paymentId (from callback handler)
   - **Load**: Find booking with pending payment
   - **Verify**:
     - Seats still held (check Redis locks exist)
     - Payment status = SUCCESS
     - Booking status still PENDING_PAYMENT
   - **Transition**:
     - Update booking status to CONFIRMED
     - Create outbox event: `booking.confirmed`
     - Trigger ticket issuance (creates tickets, also in transaction)
   - **Idempotency**: If already confirmed, return existing tickets (don't re-issue)
5. Booking Cancellation:
   - **Input**: bookingId, userId (must match booking owner)
   - **Verify**:
     - Booking status is CONFIRMED or PENDING_PAYMENT
     - For refund: booking must be ≥2 hours before showtime
   - **Release Seats**:
     - Delete Redis locks for held seats
     - Mark seats as available
     - Publish seat-released event for real-time update
   - **Create Refund Request**:
     - Record refund request: 70% of ticket price
     - Set status to PENDING_REFUND
     - Create outbox event: `refund.requested`
6. Test Scenarios:
   - Booking created → seats held, status SEAT_HELD, expiry 5 min from now
   - Duplicate booking request (same idempotencyKey) → returns existing booking, no duplicate
   - Booking confirmed after payment success → status CONFIRMED, tickets created
   - Duplicate booking confirmation → idempotent, returns same tickets
   - Cancellation within window → refund request created
   - Cancellation outside window → refund denied

---

#### 3.3 Real-Time Seat Management & Contention Handling

**Quality Attributes**: Performance (seat feedback ≤500ms), Reliability (no double-booking)

**Responsibilities**:

- Implement Redis-based seat locks with TTL
- Detect and reject seat contention immediately
- Publish seat state changes for real-time client updates
- Handle lock expiry and automatic release

**Affected Artifacts**:

- Seat Hold Manager (Redis operations)
- Seat state model
- Real-time seat update publisher (Redis Pub/Sub)
- WebSocket fanout from API Gateway

**Concrete Implementation Tasks**:

1. Seat Lock Mechanism:
   - Use Redis `SET NX PX` command for atomic lock:
     ```
     SET {seat}:{showtime} {userId}:{lockId} NX PX 300000
     // Key: seat:{seatId}:{showtimeId}
     // Value: {userId}:{lockId} (for tracking who holds it)
     // Options: NX (only if not exists), PX (expire in milliseconds)
     // TTL: 300000ms = 5 minutes
     ```
   - Return value: 1 (success) or 0 (already held by another user)
2. Seat Hold Operation:
   - User clicks seat in UI → send hold request
   - Service executes: `SeatHoldManager.holdSeat(seatId, showtimeId, userId)`
   - For each seat:
     - Attempt Redis lock with 5 min TTL
     - If lock fails: return `{success: false, reason: "seat_already_held"}`
     - If lock succeeds: record in list of held seats
   - Atomicity: either ALL seats held or NONE held (rollback on partial failure)
   - Response time: ≤100ms for 1-3 seats (direct Redis operations)
3. Seat Release Operations:
   - On hold expiry: Redis automatically deletes key after TTL
   - On booking confirmation: keep Redis lock (seat is now reserved in DB)
   - On payment failure: delete Redis lock manually (seat becomes available)
   - On user cancellation: delete Redis lock and release seat
   - All release operations publish "seat released" event
4. Real-Time Seat Update Publishing:
   - After successful hold/release: publish to Redis Pub/Sub channel:
     ```
     PUBLISH seat:showtime:{showtimeId} {"seatId": "s1", "status": "held", "userId": "u123", "lockedUntil": <timestamp>}
     ```
   - After hold expires: publish "seat released" message
   - After payment confirmation: publish "seat locked" message (permanent)
5. WebSocket Seat Updates (API Gateway responsibility):
   - API Gateway subscribes to Redis Pub/Sub for seat changes
   - When message received: broadcast to all connected WebSocket clients viewing that showtime
   - Client receives update and redraws seat map in real-time
   - Expected latency: ≤1 second (Redis → Gateway → WebSocket → Client)
6. Seat Contention Test Scenarios:
   - User 1 holds seat S1 → Lock acquired, other users see S1 as unavailable
   - User 2 attempts hold S1 simultaneously → Rejected immediately
   - User 1 holds S1 for 5 min then releases → Lock expires, S1 available again
   - User 1 holds S1, initiates payment (starts booking) → Lock maintained until confirmation or timeout
   - User 1 confirms booking for S1 → S1 remains held (now reserved, not just locked)
   - 300 concurrent seat holds on same showtime → All held/rejected within 500ms

---

#### 3.4 Redis Caching Strategy for Performance

**Quality Attributes**: Performance (cache-hit ≤1s, discovery ≤2s)

**Responsibilities**:

- Implement cache-aside pattern for read-heavy queries
- Define TTL strategies for different data types
- Handle cache invalidation and consistency
- Monitor cache hit rates and optimize

**Affected Artifacts**:

- Movie Service caching (catalog, genres)
- Cinema Service caching (halls, showtimes)
- Redis cache keys and TTL configuration
- Cache invalidation logic (on data updates)

**Concrete Implementation Tasks**:

1. Cache-Aside Pattern Implementation:
   ```typescript
   async getMovies(filter: Filter): Promise<Movie[]> {
     const cacheKey = `movies:${JSON.stringify(filter)}`;

     // Try cache first
     const cached = await redis.get(cacheKey);
     if (cached) {
       logger.info('cache.hit', {action: 'movie.list', key: cacheKey});
       return JSON.parse(cached);
     }

     // Cache miss: fetch from DB
     logger.info('cache.miss', {action: 'movie.list'});
     const movies = await this.movieRepository.find(filter);

     // Store in cache with TTL
     await redis.setex(cacheKey, 300, JSON.stringify(movies)); // 5 min TTL

     return movies;
   }
   ```
2. Cache Key Strategy:
   - Movies: `movies:{pageSize}:{page}:{genre}:{searchTerm}` (TTL: 5 min)
   - Cinemas by city: `cinemas:{city}:{pageSize}:{page}` (TTL: 10 min)
   - Showtimes: `showtimes:{movieId}:{cinemaId}:{date}` (TTL: 5 min)
   - Active promotions: `promotions:active` (TTL: 1 hour)
3. Cache Invalidation on Updates:
   - When movie metadata changes → delete cache entries for affected movies
   - When showtime added/changed → delete showtimes cache for that cinema-date
   - When promotion changes → delete promotions cache
   - Pattern: use Redis patterns or maintain index of cache keys per entity
4. TTL Configuration:
   - Movie catalog: 5 minutes (catalog changes infrequently, can be slightly stale)
   - Cinema info: 10 minutes (stable, rarely updated)
   - Showtimes: 5 minutes (can change more frequently, needs refresh)
   - Promotions: 1 hour (admin-controlled, batched updates)
5. Cache Hit Rate Monitoring:
   - Log cache hits and misses per endpoint
   - Target: 80%+ hit rate for discovery endpoints
   - If hit rate drops below 70% → investigate invalidation logic or TTL
6. Test Scenarios:
   - First request for movie list → cache miss, fetches from DB, stores in cache
   - Second request (within 5 min) → cache hit, returns from Redis
   - Update movie metadata → cache key invalidated
   - Request after TTL expiry → cache miss, refetches from DB
   - High traffic (100 req/s) → 85%+ hit rate on warm cache

---

#### 3.5 Async Outbox Processing & Event Delivery

**Quality Attributes**: Reliability (no lost events), Performance (non-blocking booking path)

**Responsibilities**:

- Implement outbox pattern for durability
- Ensure deferred side effects (notifications) don't block booking
- Handle worker retries and failure scenarios
- Maintain event delivery guarantees

**Affected Artifacts**:

- Outbox table schema
- Outbox event recording (in booking transaction)
- Async Worker process
- Retry logic and dead-letter handling

**Concrete Implementation Tasks**:

1. Outbox Table Schema:
   ```sql
   CREATE TABLE outbox_events (
     id BIGSERIAL PRIMARY KEY,
     aggregateId VARCHAR(255) NOT NULL,     -- booking ID, payment ID, etc.
     aggregateType VARCHAR(255) NOT NULL,   -- booking, payment, ticket, etc.
     eventType VARCHAR(255) NOT NULL,       -- booking.confirmed, payment.success, etc.
     eventData JSONB NOT NULL,              -- Serialized event payload
     status VARCHAR(50) NOT NULL,           -- pending, processing, delivered, failed
     correlationId UUID NOT NULL,           -- Link to user journey
     createdAt TIMESTAMP DEFAULT NOW(),
     processedAt TIMESTAMP,
     deliveryAttempts INT DEFAULT 0,
     lastAttemptAt TIMESTAMP,
     UNIQUE (aggregateId, aggregateType, eventType, createdAt) -- Prevent duplicates
   );
   ```
2. Outbox Recording (within booking transaction):
   ```typescript
   async confirmBooking(bookingId: string): Promise<void> {
     // Use database transaction
     await this.db.transaction(async (trx) => {
       // Step 1: Update booking status
       await trx('bookings')
         .where({id: bookingId})
         .update({status: 'CONFIRMED'});

       // Step 2: Create tickets
       const tickets = [{...}, {...}];
       await trx('tickets').insert(tickets);

       // Step 3: Record outbox event (same transaction!)
       await trx('outbox_events').insert({
         aggregateId: bookingId,
         aggregateType: 'booking',
         eventType: 'booking.confirmed',
         eventData: JSON.stringify({bookingId, tickets}),
         status: 'pending',
         correlationId: this.correlationId
       });
     });
   }
   ```

   - **Key point**: Booking state AND outbox event are written atomically
   - If booking write succeeds but outbox fails, entire transaction rolls back
   - This ensures consistency: no booking without an event, no event without a booking
3. Async Worker Process:
   ```typescript
   @Injectable()
   export class OutboxWorker {
     async processPendingEvents(): Promise<void> {
       // Poll every 5 seconds
       const events = await this.db('outbox_events')
         .where({status: 'pending'})
         .orderBy('createdAt', 'asc')
         .limit(100); // Process in batches

       for (const event of events) {
         try {
           // Mark as processing (idempotency)
           await this.db('outbox_events')
             .where({id: event.id})
             .update({status: 'processing'});

           // Dispatch event (e.g., send notification)
           await this.dispatchEvent(event);

           // Mark as delivered
           await this.db('outbox_events')
             .where({id: event.id})
             .update({status: 'delivered', processedAt: NOW()});
         } catch (error) {
           // Retry logic
           if (event.deliveryAttempts < 3) {
             // Retry: reset to pending
             await this.db('outbox_events')
               .where({id: event.id})
               .increment('deliveryAttempts', 1)
               .update({
                 status: 'pending',
                 lastAttemptAt: NOW()
               });
           } else {
             // Dead letter: failed after 3 attempts
             await this.db('outbox_events')
               .where({id: event.id})
               .update({status: 'failed', processedAt: NOW()});
             logger.error('outbox.delivery_failed', {eventId: event.id, ...});
           }
         }
       }
     }
   }
   ```
4. Event Dispatch Implementation:
   - For `booking.confirmed` event: send confirmation notification (email/SMS)
   - For `payment.success` event: send payment receipt
   - Dispatch delegates to notification adapter (which handles provider-specific logic)
5. Idempotency in Outbox Processing:
   - Before dispatching, check if event already delivered
   - Use unique constraint on (aggregateId, aggregateType, eventType, createdAt)
   - If duplicate event created (retry scenario), database constraint prevents insertion
6. Dead-Letter Handling:
   - After 3 failed attempts, move event to `failed` status
   - Create separate process to review failed events (manual intervention or logging)
   - Do NOT silently drop events; they must be auditable
7. Test Scenarios:
   - Booking confirmed → outbox event created in same transaction
   - Worker processes event → notification sent, event marked delivered
   - Notification provider timeout → worker retries up to 3 times
   - After 3 retries, event marked failed (not lost, auditable)
   - Duplicate booking confirmation (idempotent retry) → event created once, not twice

---

#### 3.6 Performance Optimization & Latency Measurement

**Quality Attributes**: Performance (p95 latency targets), Observability (latency tracking)

**Responsibilities**:

- Measure and optimize latency for critical paths
- Enforce pagination and bounded queries
- Monitor and alert on latency degradation
- Profile and optimize hot paths

**Affected Artifacts**:

- Booking service response time
- Browse/discovery response time
- Database index optimization
- Query result size limitations
- Latency monitoring and alerting

**Concrete Implementation Tasks**:

1. Latency Measurement:
   - Every request measures: start → end time
   - Log duration in ms
   - Aggregate into percentiles: p50, p95, p99
   - Example log:
     ```json
     {
       "action": "booking.list",
       "durationMs": 182,
       "message": "Listed bookings for user",
       "metadata": { "count": 5 }
     }
     ```
2. Latency Targets (from ADD):
   - Booking creation (commit path): ≤3s (p95), ≤5s (p99)
   - Browse/discovery (read path): ≤2s (p95), ≤3s (p99)
   - Seat-map load: ≤2s (p95), ≤3s (p99)
   - UI feedback (seat hold): ≤500ms
   - Cache-hit latency: ≤1s
3. Pagination Enforcement:
   - Every list endpoint has: `page`, `limit` parameters
   - Default: page=1, limit=10
   - Maximum: limit=50
   - Reject requests with limit > 50
   - Add validation pipe:
     ```typescript
     @Get('/bookings')
     @UsePipes(PaginationPipe) // Validates and caps limit
     getBookings(@Query() {page, limit}: PaginationDto) {
       // page defaults to 1, limit caps at 50
     }
     ```
4. Database Query Optimization:
   - Add indexes on frequently filtered columns:
     - `bookings.userId` (users querying own bookings)
     - `bookings.showtimeId` (seat capacity queries)
     - `showtimes.cinemaId, showtimes.movieId, showtimes.date`
     - `movies.title` (search)
   - Use EXPLAIN to verify index usage
   - Avoid full table scans on large tables
5. Query Result Size:
   - Every query should return ≤ (10 rows default, 50 max)
   - Use pagination limit to naturally bound result size
   - Count total results separately if needed (don't load into memory)
6. Latency Monitoring Setup:
   - Dashboard: track p50, p95, p99 latency over time
   - Alert if p95 latency exceeds 5s for 5 minutes
   - Alert if booking path exceeds 3s p95 for 5 minutes
   - Analyze latency spikes (compare against traffic volume, error rate, resource usage)
7. Hot Path Profiling:
   - Identify slowest endpoints in production logs
   - Analyze SQL queries for that endpoint
   - Check if query uses indexes (EXPLAIN ANALYZE)
   - If slow, optimize: add index, denormalize, cache, or split query
8. Test Scenarios:
   - Browse 100 requests/s → p95 latency ≤2s
   - Seat hold on 300 concurrent users → p95 response ≤500ms
   - Booking create under 100 req/s → p95 latency ≤3s
   - Booking list with 1000 records → paginated, default 10 items, ≤1s response

---

### Summary: Member 3 Deliverables

| Responsibility           | Concrete Deliverables                                                           | Timeline           | Dependencies                          |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------ | ------------------------------------- |
| Structured Logging       | Logging module, correlation ID propagation, account/event/method standards      | Week 1-2           | Observability infrastructure          |
| Booking Core Logic       | Booking state machine, repository, creation/confirmation/cancellation flows     | Week 2-4           | Database schema finalized             |
| Seat Management          | Redis seat locks, TTL expiry, contention handling, real-time updates            | Week 2-3           | Redis setup, WebSocket infrastructure |
| Redis Caching            | Cache-aside pattern, TTL configuration, invalidation logic, hit rate monitoring | Week 1-2           | Redis availability                    |
| Outbox Pattern           | Outbox table, event recording, worker processing, retry/dead-letter logic       | Week 3-4           | Database schema                       |
| Performance Optimization | Latency measurement, pagination, indexing, monitoring, profiling                | Week 1-4 (ongoing) | Observability stack                   |

---

## Cross-Team Dependencies & Integration Points

### Critical Handoffs

1. **Member 1 → Member 2**: Health checks must indicate when payment provider is unreachable (affects auth boundary)
2. **Member 2 → Member 3**: Correlation ID from auth context must flow to booking service and logging
3. **Member 3 → Member 1**: Booking latency metrics inform capacity planning and scaling decisions
4. **Member 1 → Member 3**: Backup restore validation requires booking service consistency checks

### Minimal Overlap

- **Member 1 does NOT implement**: Payment logic, authorization rules, booking state transitions
- **Member 2 does NOT implement**: Infrastructure deployment, booking orchestration, structured logging
- **Member 3 does NOT implement**: Health checks, secret management, failover orchestration

### Communication Protocol

- **Weekly sync**: 30 min standup on Monday to track progress and identify blockers
- **Async updates**: Post daily progress in shared channel
- **Code review**: Cross-team review for integration points (logging interceptors, health checks, payment callbacks)
- **Integration testing**: Bi-weekly integration test run with all components

---

## Quality Attribute Mapping to Team Responsibilities

| Quality Attribute        | Member 1                                     | Member 2                               | Member 3                                       |
| ------------------------ | -------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| **Availability**         | Health checks, failover, instance management | Auth boundary availability             | Booking path resilience                        |
| **Security**             | Health probe confidentiality                 | Auth, RBAC, payment isolation, secrets | Logging without exposing sensitive data        |
| **Performance**          | Load balancer optimization                   | Fast auth validation                   | Caching, pagination, booking latency           |
| **Maintainability**      | Clear deployment procedures                  | Isolated adapters for integrations     | Modular service logic, clear state transitions |
| **Logging**              | Health check logs, deployment events         | Auth failure logs, payment events      | Structured JSON, correlation ID, event logging |
| **Backup & Restoration** | Backup automation, restore orchestration     | Payment state consistency              | Booking state validation during restore        |
| **Reliability**          | No data loss during failover                 | Exactly-once callback handling         | Exactly-once booking confirmation, idempotency |
| **Scalability**          | Horizontal scaling config                    | Auth throughput optimization           | Query optimization, caching strategy           |
| **Interoperability**     | -                                            | Payment/notification adapter contracts | Outbox event schema, service APIs              |

---

## Implementation Timeline

### Phase 1: Weeks 1-2 (Foundation)

**Member 1**: Health checks, deployment config, retry policy
**Member 2**: Auth/token validation, RBAC guards
**Member 3**: Logging module, correlation ID propagation, Redis caching

**Deliverables**:

- Health check module deployed to all services
- Auth guards protecting all endpoints
- Structured logging on all requests
- Redis cache working for discovery queries

---

### Phase 2: Weeks 3-4 (Core Transactions)

**Member 1**: Backup/restore procedures, monitoring setup
**Member 2**: Payment adapter, callback validation
**Member 3**: Booking state machine, seat management, outbox pattern

**Deliverables**:

- Booking workflow end-to-end (create → confirm → cancel)
- Payment processing with callback handling
- Backup procedures verified with restore test
- Outbox-based notification delivery

---

### Phase 3: Weeks 5-6 (Optimization & Hardening)

**Member 1**: Failover testing, load balancer tuning
**Member 2**: Notification adapters, additional provider integration
**Member 3**: Performance profiling, latency optimization, dead-letter handling

**Deliverables**:

- Failover tested: single instance loss recovers within 5s
- Latency p95 meets targets (booking ≤3s, browse ≤2s)
- End-to-end integration tests passing
- Disaster recovery runbook validated

---

## Success Criteria

### Member 1 (Infrastructure & Reliability)

- ✅ All services report health with `/health/live` and `/health/ready`
- ✅ Failed instance detected and removed within 30 seconds
- ✅ Backup runs on schedule; restore completes within SLA
- ✅ Failover tested: request in-flight during instance failure completes on another instance

### Member 2 (Security & Integration)

- ✅ 100% of protected endpoints enforce authentication and RBAC
- ✅ Payment callbacks validated with signature before state change
- ✅ No payment data stored internally; all secrets in secure store
- ✅ Payment idempotency keys prevent duplicate bookings

### Member 3 (Core Transaction & Observability)

- ✅ Booking created → confirmed → cancelled follows state machine, no orphaned states
- ✅ Two concurrent users attempting same seat: one succeeds, one rejected within 500ms
- ✅ Correlation ID visible in logs for any user journey
- ✅ p95 latency: booking ≤3s, browse ≤2s, seat feedback ≤500ms
- ✅ Notification delivery guaranteed via outbox; no lost events

---

## Dependencies & Prerequisites

### Required Infrastructure

- Kubernetes or Azure Container Apps (for pod management, health checks, scaling)
- PostgreSQL with replication (for transactional data and PITR)
- Redis (for caching and seat coordination)
- Observability stack (logs, metrics, tracing)
- Clerk SaaS instance (for identity)
- Payment provider API access (VNPay or equivalent)

### Required Configuration

- Service-to-service network connectivity
- TLS certificates for HTTPS/WebSocket
- Backup storage (object storage for snapshots)
- Secret store integration (for API keys and provider secrets)

### Required Coordination

- API contract agreement between services
- Log schema standardization
- Error code registry
- Compensation/rollback procedures documentation

---

## Risk Mitigation

| Risk                                     | Impact                       | Mitigation                                                                           |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| Payment provider down during testing     | Booking path untested        | Mock payment adapter for testing; use staging provider account for integration tests |
| Backup restore takes >1 hour             | Unacceptable RTO             | Test restore procedure weekly; optimize backup size and compression                  |
| Seat contention causes lock storms       | Performance degradation      | Use bounded TTL and fast rejection; test with 300 concurrent users                   |
| Correlation ID propagation incomplete    | Forensic analysis impossible | Enforce ID generation at gateway; test end-to-end journey traceability               |
| Auth token validation adds 100ms latency | Booking path exceeds budget  | Cache Clerk keys; use local token validation; measure and optimize                   |

---

## References

- **ADD Document**: [docs/architecture/add.md](../add.md) — Quality attribute requirements and design decisions
- **SAD Document**: [docs/architecture/SAD/sad.md](./sad.md) — Architecture rationale and component details
- **C4 Models**: [docs/architecture/c4/](../c4/) — System context, containers, components, deployment
- **Drivers**: [docs/architecture/drivers.md](../drivers.md) — Business context and constraints

---

**Document Author**: GitHub Copilot  
**Last Updated**: May 5, 2026  
**Status**: Ready for team review and commitment
