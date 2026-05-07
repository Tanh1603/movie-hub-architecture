# Software Architecture Document - MovieHub

## 1. Introduction & Goals

### 1.1 Business Context and System Purpose

MovieHub is a microservices-based cinema booking platform that must support the complete customer journey from discovery to admission while preserving correctness at the booking boundary. The platform is not primarily a content site; it is a transactional system where small failures can create direct revenue loss, customer dissatisfaction, or financial reconciliation defects.

The architectural problem is to balance three competing forces at once: high-volume read traffic for browsing, high-concurrency contention during seat selection, and failure-prone external integration for payment, notifications, and identity. The design must keep the booking path short enough for conversion, isolate external-provider failures from core booking state, and preserve a trustworthy audit trail for operational and financial recovery.

MovieHub addresses this by separating the platform into independently deployable services with explicit ownership of data and responsibilities. That separation is not accidental complexity. It is the primary control used to prevent a failure in one concern area, such as payment callbacks or catalog refreshes, from collapsing the whole platform.

### 1.2 Stakeholders

The primary stakeholders are customers, cinema managers, platform administrators, development teams, DevOps/SRE personnel, and external identity, payment, and notification providers.

Customers need fast discovery, rapid seat feedback, reliable checkout, and clear confirmation. Cinema managers need schedule correctness, conflict prevention, and timely operational visibility. Platform administrators need uptime, observability, and recovery procedures that do not require data ambiguity or manual reconciliation. Developers need service boundaries that reduce change blast radius and keep test scope manageable. Operations teams need failure isolation, deployability, and a restore path for transactional data. External providers need stable contracts that MovieHub can adapt to without leaking provider-specific semantics into domain logic.

### 1.3 Key Functional Requirements

The core functional scope includes authentication, movie browsing, cinema and showtime discovery, seat holding, booking creation, payment initiation, payment callback handling, cancellation and refund processing, ticket issuance, gate validation, and asynchronous notifications. The booking flow is the transactional core because it owns the state transition from temporary seat intent to confirmed financial outcome.

The architecture must support read-heavy discovery flows, real-time seat interaction, resilient payment integration, asynchronous side effects, and post-incident recovery. The C4 artifacts are the authoritative structural and runtime views for these requirements: [System Context](../c4/c4-context.md), [Container Diagram](../c4/c4-containers.md), [Booking Component Diagram](../c4/c4-components-booking.md), [Deployment Diagram](../c4/c4-deployment.md), [Booking Flow](../c4/c4-dynamic-booking.md), [Payment Callback Flow](../c4/c4-dynamic-payment-callback.md), [Real-time Seat Update Flow](../c4/c4-dynamic-realtime-seat-update.md), and [Async Outbox Processing](../c4/c4-dynamic-outbox-processing.md).

### 1.4 Quality Goals Extracted from Drivers and QAS

The architecture is shaped by the drivers in [docs/architecture/drivers.md](../drivers.md), the quality attribute requirements in [docs/architecture/QAS.md](../QAS.md), and the tactic catalogue in [docs/architecture/tactics.md](../tactics.md). The dominant goals are concrete operational outcomes with measurable consequences.

| Quality goal                 | Architectural implication                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance                  | Browsing must stay cache-friendly and pagination-bounded; the booking commit path must remain short; seat-state updates must be visible quickly enough to prevent contention and abandoned checkout. |
| Availability                 | Core services must survive instance loss and external provider outages without taking the platform offline.                                                                                          |
| Reliability                  | Exactly one business effect must result from one successful payment or callback, even under retries, duplicates, or race conditions.                                                                 |
| Security                     | Identity, authorization, payment, and callback handling must remain inside explicit trust boundaries and resist replay, spoofing, and credential abuse.                                              |
| Modifiability                | Business rules and provider integrations must change locally, not across the whole platform.                                                                                                         |
| Observability / auditability | The system must reconstruct journeys, payments, callbacks, and failures through correlation-aware logging and tracing.                                                                               |
| Scalability                  | The edge, services, cache, and workers must scale independently so that read load does not starve transaction processing.                                                                            |
| Configurability              | Deployments must be adjustable by environment and secret injection without code changes.                                                                                                             |
| Maintainability              | Clear module boundaries, service ownership, and test seams must keep defect isolation and feature delivery tractable.                                                                                |
| Testability                  | Business-critical flows must be verifiable with integration tests, mocks, and isolated service boundaries.                                                                                           |

## 2. Constraints

### 2.1 Technical Constraints

MovieHub is implemented as an Nx monorepo with NestJS, TypeScript, Prisma, Next.js, PostgreSQL, Redis, Docker, and WebSocket-based real-time communication. The solution is constrained to the documented microservices topology: API Gateway, User Service, Movie Service, Cinema Service, Booking Service, Redis, and service-owned PostgreSQL databases, with Clerk, payment gateways, and notification providers as external systems.

The important constraint is not the technology list itself but the ownership model. Each service owns its schema and transactional consistency boundary. That rule prevents the false economy of a shared database, where the system looks simpler at first and becomes ungovernable once booking, payment, and operational workflows begin competing for the same tables and invariants.

### 2.2 Organizational Constraints

The solution must support independent service updates, localized change impact, and near-zero-downtime deployment because the domain changes frequently across refunds, payment providers, notification providers, and booking rules. This means the architecture must tolerate more deployment and observability overhead than a monolith would require.

That trade-off is intentional. The business needs fault isolation and release autonomy more than it needs reduced operational surface area. The cost is higher infrastructure discipline, but the mitigation is explicit service boundaries, containerized deployment, and strong telemetry.

### 2.3 External System Dependencies

The main external dependencies are Clerk for identity, payment gateways for checkout and callback processing, notification providers for email/SMS, and the observability stack for telemetry export. These systems are outside MovieHub control, so their uptime, schema, and callback behavior cannot be assumed to be stable.

The architecture therefore isolates provider-specific behavior behind adapters and canonical models. That keeps external instability from contaminating booking rules and makes provider replacement a bounded change rather than a rewrite.

### 2.4 Design Constraints From the Drivers

The drivers document adds hard numeric expectations that shape the design: normal read traffic around 100 req/s, peak traffic around 300 req/s on hot interactions, seat feedback around 500 ms, cache-hit latency within 1 second, health checks every 10 seconds with a 2 second timeout, unhealthy instance removal within 30 seconds, bounded retries for external dependencies, and release of held seats within 1 minute after failure or expiry.

These are not simply non-functional targets. They force architectural decisions about where state lives, when synchronous work ends, where retries belong, and which failure modes must be converted into recoverable states instead of user-visible outages.

## 3. Context View

### 3.1 System Boundary

The system boundary comprises all MovieHub backend microservices, the web application, shared Redis infrastructure, and service-owned databases. Everything outside that boundary is treated as an external actor or external system.

The boundary is defined in the C4 context view: [docs/architecture/c4/c4-context.md](../c4/c4-context.md). That diagram is the authoritative external-systems view and should be consulted before any implementation or integration change because it shows which dependencies can fail independently without violating internal domain correctness. The C4 diagrams in this document follow the guidance in [docs/architecture/c4-architecture/README.md](../c4-architecture/README.md) and the anti-pattern checks in [docs/architecture/c4-architecture/references/common-mistakes.md](../c4-architecture/references/common-mistakes.md).

### 3.2 External Actors and Interactions

Customers use the web application through HTTPS and WebSocket channels. Cinema managers use authenticated web-based operational functions. Platform administrators observe and operate the system through administrative interfaces and monitoring tools.

MovieHub delegates identity verification to Clerk, payment processing to an external gateway, notification delivery to third-party providers, and telemetry export to the observability stack. The architectural risk here is not merely latency; it is that each external system can fail differently. The design therefore treats external dependencies as bounded integrations rather than trusted internal collaborators.

### 3.3 Context Implications

The context view creates two architectural obligations. First, external providers must be isolated behind stable contracts so that provider drift does not propagate into the booking core. Second, user-facing flows must remain usable when asynchronous integrations lag or fail. That is why the system separates booking completion from notification completion and treats provider callbacks as reconciliation events rather than as direct business authority.

## 4. Solution Strategy

### 4.1 Overall Architecture Style

MovieHub uses a microservices architecture with API Gateway mediation, service-per-database ownership, Redis-backed caching and coordination, and event-driven side-effect processing. The Booking Service is the transactional core, while other services handle discovery, identity-adjacent concerns, and domain-specific data access.

Microservices are necessary here for a reason that is often undersold: the platform has multiple incompatible optimization regimes. Browsing wants read scaling and cache locality. Seat selection wants contention control and low-latency state propagation. Booking and payment want correctness, idempotency, and auditable transitions. Notifications want eventual delivery and retry. A single codebase with one consistency model would either over-constrain reads or under-protect booking correctness.

The architecture is therefore hybrid. Commands use synchronous request/response until the business decision is recorded. Side effects such as notifications and some reconciliation tasks are deferred to asynchronous workers. That keeps the user-facing path short while preserving durable state for later recovery.

### 4.2 Quality Attribute to Tactic to Decision Mapping

| Quality attribute | Tactics used                                                                                                      | Architectural decision                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Performance       | Bound execution time, reduce overhead, maintain multiple copies of data, introduce concurrency, prioritize events | Use Redis for cache, seat-state propagation, and short-lived coordination; keep booking writes minimal; use WebSocket fanout for seat updates; enforce pagination. |
| Availability      | Detect faults, active redundancy, retry, graceful degradation, removal from service                               | Run multiple service instances behind a load balancer; use health checks; remove unhealthy instances quickly; isolate external dependency failures.                |
| Reliability       | Transactions, idempotency, state resynchronization, exception handling, rollback                                  | Use transactional booking records, idempotency keys, duplicate-callback suppression, and durable outbox records.                                                   |
| Security          | Authenticate actors, authorize actors, encrypt data, separate entities, maintain audit trail                      | Delegate identity to Clerk, validate tokens at the gateway and service boundary, enforce RBAC server-side, and keep payment logic out of the core domain.          |
| Modifiability     | Use an intermediary, abstract common services, reduce coupling, service abstraction                               | Place API Gateway in front of services and isolate payment and notification providers behind adapter layers.                                                       |
| Observability     | Maintain audit trail, propagate context, monitor, timestamp, sanity checking                                      | Assign correlation IDs at ingress, carry them across services and events, and emit structured logs and traces at gateway, service, and worker boundaries.          |
| Scalability       | Increase resources, introduce concurrency, maintain multiple copies of data                                       | Scale gateway, services, workers, and cache independently; keep read and write paths separated.                                                                    |
| Configurability   | Defer binding, service abstraction                                                                                | Drive environment-specific behavior through configuration and secret injection rather than source changes.                                                         |
| Maintainability   | Split module, increase cohesion, reduce coupling, refactor                                                        | Keep domain modules bounded by service and by booking sub-responsibility.                                                                                          |
| Testability       | Test interfaces, record/playback, abstract data sources, sandbox                                                  | Use dependency injection, mock providers, isolated service tests, and integration tests around booking and callback logic.                                         |

### 4.3 ADD-Driven Major Design Choices

The ADD decisions in [docs/architecture/add.md](../add.md) strongly influence the design. The most important are concurrency-safe seat reservation, booking-payment consistency, graceful handling of external provider outages, real-time seat update propagation, and observability of critical journeys.

The resulting architectural decisions are:

- Redis is used for seat locks and short-lived cache entries because seat contention must be resolved quickly with bounded expiry.
- Payment integration is separated through a payment adapter because provider interoperability and security require a stable canonical model in the core.
- The outbox pattern plus an async worker is used because booking confirmation must remain durable even if downstream side effects fail.
- WebSocket plus Redis Pub/Sub is used because real-time seat-state propagation must reach clients within a tight latency budget.
- The API Gateway is used because authentication, routing, and real-time ingress are cross-cutting concerns that would otherwise be duplicated in every service.

### 4.4 Trade-offs

The architecture deliberately accepts higher operational complexity in exchange for scalability, fault isolation, and domain autonomy. That cost is real: distributed tracing, deployment orchestration, schema ownership, and failure management all become first-class concerns.

The trade-off is justified because the business domain is latency-sensitive, failure-sensitive, and integration-heavy. A monolith would reduce some coordination cost but would collapse the independence needed for booking, payment, and read-heavy discovery flows to evolve safely.

There is also a controlled trade-off between strong consistency and throughput. The booking core keeps the synchronous path minimal and pushes non-critical side effects into asynchronous workers. That means some events are eventually consistent, but the authoritative booking and payment states remain durable and transactionally guarded.

## 4.5 Implementation Guidelines (Global)

This section defines the baseline implementation rules that every service must follow.

### Cross-Service Rules

- Use NestJS modules as the primary unit of encapsulation inside each service. Keep controllers thin, move orchestration into application services, and keep domain rules in service-specific providers or domain classes.
- Keep PostgreSQL as the authoritative system of record for each service. Redis may cache, lock, and broadcast, but it must never be treated as a source of durable business truth.
- Keep integration adapters isolated in separate NestJS providers or modules. Payment, notification, and identity integrations must be replaceable without changing booking core logic.
- Use async workers for all side effects that are not required for immediate user confirmation. Do not block booking completion on notification delivery or outbox relay publication.
- Version public APIs and internal event contracts intentionally. A service may evolve its internal schema, but published API shapes and event payloads require compatibility review.

### Correlation ID Propagation

- Generate a correlation ID at the API Gateway for every inbound request and WebSocket session handshake.
- Store the ID in request-scoped context and propagate it to downstream service calls through headers such as `x-correlation-id`.
- Copy the same ID into structured logs, outbox records, and async worker jobs so synchronous and asynchronous work can be linked.
- Preserve the original correlation ID when a request retries or a callback is replayed. A replay should produce a new transport attempt ID but must not lose the original journey ID.

### Error Handling Standard

- Use consistent error envelopes across all services. Return a stable machine-readable error code, a safe user-facing message, and a correlation ID.
- Fail fast for invalid input, expired booking windows, invalid signatures, or authorization failures. These are not retryable.
- Retry only transient failures: gateway timeouts, temporary Redis failures, short-lived DB connection failures, and provider 5xx responses.
- Map infrastructure exceptions to domain-safe responses at the boundary. Controllers should not leak stack traces or provider internals.

### API Design Rules

- Make all list endpoints paginated. Use `page=1` and `limit=10` as defaults and cap `limit` at 50.
- Keep mutation endpoints idempotent where the client may retry: booking creation, payment initiation, payment callback, cancellation, and refund request creation.
- Use explicit state transition endpoints instead of overloaded update endpoints when the action has business meaning.
- Prefer read models for discovery flows and command models for booking/payment flows. Do not force a single DTO to serve both.

## 5. Building Block View

### 5.1 Level 1 - Containers

The container view is documented in [docs/architecture/c4/c4-containers.md](../c4/c4-containers.md). It is the authoritative structural overview for the runtime system.

#### Responsibilities and Boundaries

The Web App is the user-facing client for browsing, seat selection, and checkout. It consumes the API Gateway and receives real-time seat updates. If the web app were merged into backend services, frontend release cycles, caching behavior, and browser-specific concerns would contaminate backend deployment boundaries and reduce release autonomy.

The API Gateway is the entry point for all synchronous client traffic. It handles routing, auth enforcement, request aggregation, and WebSocket ingress. The gateway is intentionally thin and should not contain domain rules. If the gateway absorbed booking logic, it would become the highest-risk deployment unit and create a brittle release chokepoint.

The User Service manages profiles, roles, and account-related data. This isolates identity-adjacent business rules from the booking core so changes to staff roles or account metadata do not destabilize booking transactions.

The Movie Service manages movie catalog data and read-heavy discovery queries. It exists because catalog reads have different scaling and caching behavior from transactional booking data. Merging it with booking logic would force read spikes and write contention into the same code and database path.

The Cinema Service owns cinemas, halls, seats, and showtimes. This ownership prevents schedule and seat-structure rules from leaking into booking orchestration. If merged into booking, the system would couple schedule administration to payment flows and make both harder to reason about.

The Booking Service is the transactional domain core. It owns seat-hold coordination, booking lifecycle transitions, payment orchestration, callback reconciliation, and ticket issuance. This service is intentionally isolated because it carries the highest consistency risk. If merged with catalog or cinema concerns, a failure in read optimization or schedule management could directly threaten booking correctness.

The Booking Async Worker processes outbox events and asynchronous side effects. It is separated from the request path so notification delivery and deferred work cannot block booking responsiveness. If merged into the synchronous API flow, notification provider latency would become checkout latency.

Redis supports read optimization, seat-state messaging, and short-lived coordination. It is a shared infrastructure service, not a source of business truth. The design relies on this distinction: Redis can accelerate and coordinate, but PostgreSQL remains the system of record.

Each PostgreSQL database is owned by a single service, which prevents shared-database coupling and keeps service boundaries explicit. The cost is cross-service data access via APIs or events rather than direct joins, but that is the price of keeping release and recovery boundaries clean.

### 5.2 Level 2 - Components in Booking Service

The Booking Service internal structure is documented in [docs/architecture/c4/c4-components-booking.md](../c4/c4-components-booking.md).

#### Internal Structure

The Booking API receives booking-related commands from the API Gateway and maps them into application use cases. It should remain an orchestration entry point rather than a business-rule location.

The Booking Core coordinates the booking lifecycle. It validates seat state, creates pending booking records, prepares payment initiation, and ensures that state transitions are performed in a controlled order. It exists because booking correctness depends on a single authoritative transition path; scattering those transitions across controllers or workers would make idempotency and compensation unreliable.

The Seat Hold Manager is responsible for seat-state coordination through the shared caching and messaging infrastructure. It keeps reservation logic isolated from higher-level orchestration concerns so that lock semantics, TTL enforcement, and conflict handling can evolve independently of booking and payment logic.

The Payment Integration translates the canonical payment model into provider-specific requests and validates provider callbacks. This protects the booking core from payment-provider detail and makes provider replacement or extension feasible. If this logic were embedded directly in Booking Core, provider-specific callback rules would pollute booking invariants and raise security risk.

The Async Processing component handles deferred notifications and other side effects. It exists because notification delivery is not part of the critical booking confirmation path. If it were merged into Booking Core, a temporary provider outage would degrade booking throughput.

#### Component Boundary Implications

The booking component structure centralizes mutation logic, minimizes duplicate state transitions, and separates time-sensitive user actions from failure-prone side effects. This structure is essential for reliability, for low-latency checkout, and for maintaining a clear recovery boundary after payment or callback failures.

## 6. Runtime View

### 6.1 Booking Flow

The booking flow is documented in [docs/architecture/c4/c4-dynamic-booking.md](../c4/c4-dynamic-booking.md). It covers the synchronous seat-hold, pending booking creation, and payment-initiation path only.

#### Normal Path

1. The Web App submits a booking command through the API Gateway.
2. The gateway validates the caller and forwards the request to the Booking Service.
3. The Booking Core validates that the seat hold is still valid and that the request is consistent with the current booking state.
4. The Seat Hold Manager acquires or confirms the temporary reservation state in Redis.
5. The Booking Core writes the pending booking record to PostgreSQL.
6. The Payment Integration creates the payment initiation request and returns the payment redirect or checkout instruction.

#### Failure Paths and Why They Matter

If seat contention occurs, the architecture rejects the stale or conflicting action immediately rather than waiting for a database conflict. This protects user experience and prevents a thundering herd on the booking database.

If the request is retried, the system reuses the existing pending booking state instead of creating a second checkout path. The risk here is duplicate financial initiation; the mitigation is idempotency keys and state checks on the booking record.

If the payment gateway times out, the booking remains recoverable instead of being partially committed and forgotten. That is why payment initiation is treated as a bounded external call with retry and clear user-visible status.

#### Runtime Implications

The booking runtime is deliberately short. It keeps the synchronous path to the minimum set of state transitions needed to make the booking durable and to hand control to the provider without opening a second execution lane.

### 6.2 Payment Callback Flow

The payment callback flow is documented in [docs/architecture/c4/c4-dynamic-payment-callback.md](../c4/c4-dynamic-payment-callback.md). It isolates provider callback handling, duplicate-callback suppression, and ticket issuance after successful payment.

#### Normal Path

The payment provider sends a callback to the Payment Integration. The callback is authenticated and validated, normalized into the canonical payment model, and then applied to the booking state. If the callback indicates success, the booking is confirmed and ticket issuance is triggered. If it indicates failure or expiration, the booking remains unconfirmed and the seat release path is activated.

#### Failure Paths

The main danger in callback processing is replay or delayed delivery. Without idempotent handling, the same callback could create duplicate confirmations, multiple tickets, or contradictory states. The design avoids that by verifying signatures, checking current state, and ignoring duplicate delivery after the first successful processing.

#### Runtime Implications

Callback processing is asynchronous from the customer's perspective but authoritative for the booking lifecycle. This means the callback path must be both fast enough for provider expectations and strict enough to prevent replay-induced corruption.

### 6.3 Real-time Seat Update Flow

The real-time seat update flow is documented in [docs/architecture/c4/c4-dynamic-realtime-seat-update.md](../c4/c4-dynamic-realtime-seat-update.md). It shows how seat-state changes are published through the shared messaging infrastructure and pushed to connected clients by the API Gateway WebSocket path.

#### Normal Path

When a seat is held, released, or expired, the Booking Service publishes a seat-state change into Redis. The API Gateway consumes that state and pushes a WebSocket update to connected clients so the visible seat map reflects the new state quickly.

#### Failure Paths

If a client disconnects or a WebSocket session drops, the authoritative state is not lost because Redis and PostgreSQL remain the source of truth. The client will recover by reloading the seat map and reading the latest state. If Redis is degraded, the booking core continues to protect durable booking state while real-time fanout may degrade temporarily.

#### Race Condition Handling

Seat selection is a race-prone interaction by definition. The architecture deals with that by using short-lived locks and immediate conflict rejection rather than waiting for long-lived database contention. That makes the visible UX deterministic even under concurrent seat clicks.

### 6.4 Async Outbox Processing

The async outbox flow is documented in [docs/architecture/c4/c4-dynamic-outbox-processing.md](../c4/c4-dynamic-outbox-processing.md). It shows how the Booking Service records durable integration events and how the worker later polls the outbox table and sends notifications.

#### Normal Path

The Booking Service records the domain change and its outbox entry in the same transaction. The Async Worker later reads pending events, delivers the external side effect, and marks the event complete.

#### Failure Paths

If the worker crashes after reading but before marking completion, the event remains recoverable because the outbox record is durable. If the notification provider is unavailable, the worker can retry without rolling back the booking itself. This is the key separation of concerns: side effects may be delayed, but booking state does not become ambiguous.

## 7. Deployment View

### 7.1 Infrastructure Mapping

The deployment view is documented in [docs/architecture/c4/c4-deployment.md](../c4/c4-deployment.md). It maps MovieHub containers onto a cloud region with an ingress layer, application cluster, managed data services, and observability services.

The Web App runs on client devices. The API Gateway and backend services run in replicated container instances behind a managed load balancer. PostgreSQL and Redis are deployed as managed clustered data services. Observability is centralized through logs, metrics, and tracing infrastructure.

### 7.2 Failure Zones

The deployment topology creates distinct failure zones. The edge zone can fail independently from the application cluster. The application cluster can lose one or more service replicas without taking the platform down. The data tier can degrade at the database or cache layer independently. External provider outages are separate still.

This separation matters because it defines the smallest recoverable unit. A gateway failure should not require database recovery. A Redis failure should not invalidate confirmed bookings. A notification outage should not block booking confirmation. Those boundaries are the operational expression of the architecture’s correctness strategy.

### 7.3 Scalability and Bottlenecks

Horizontal scaling is the primary scaling mechanism. The gateway and services are deployed as multiple instances so traffic can be distributed and individual instances can fail without complete interruption.

The likely bottlenecks are not uniform. Read-heavy browsing can saturate cache and query paths. Seat contention can saturate Redis and the booking hot path. Payment and callback spikes can saturate the booking service and external connectivity. Background processing can lag if notification volume spikes. The architecture therefore scales workers independently and keeps booking logic short so the transaction path does not become a throughput sink.

### 7.4 Network Boundary Reasoning

Network boundaries separate client traffic, service-to-service traffic, data access, and external internet traffic. That separation is part security boundary and part availability boundary. Public traffic must be sanitized at the gateway. Service traffic must remain internal and authenticated. External provider calls must be contained so that a slow provider cannot exhaust the whole application tier.

### 7.5 Fault Tolerance

Failure tolerance is achieved through health-based routing, replicated application instances, managed data services, and explicit isolation of external provider calls. The design assumes external calls can fail independently of the platform. Therefore, external systems are not embedded directly in critical domain logic; they are reached only through bounded adapters and controlled retry logic.

## 8. Cross-cutting Concepts

### 8.1 Authentication

Authentication is delegated to Clerk, which handles identity verification, OTP support where required, and session issuance. The API Gateway validates JWTs and session tokens before routing protected requests to downstream services.

The problem being solved is trust concentration. If every service handled identity independently, token validation would diverge and security failures would multiply. The decision is to centralize identity at Clerk and trust MovieHub only to validate signed identity artifacts at the boundary. The trade-off is dependence on an external identity provider; the mitigation is clear failure handling and boundary validation.

### 8.2 Authorization

Authorization is enforced as role-based access control at the backend boundary. Protected endpoints verify the caller’s role and ownership context before performing mutations or returning private data.

The risk is that frontend controls can be bypassed and that customer, staff, and administrator actions have different blast radii. The decision is to keep authorization server-side and to apply it on every protected request. The mitigation is consistent policy enforcement and narrow ownership checks, especially around bookings, refunds, and admin operations.

### 8.3 Logging

Logging is structured at three levels.

- Account-level logging records significant user actions such as login, seat hold, booking confirmation, cancellation, and payment attempts.
- Event-level logging records domain state changes such as booking creation, payment callback processing, ticket issuance, notification dispatch, and refund lifecycle changes.
- Method-level logging records operational details such as retries, lock acquisition outcomes, validation failures, and provider error classification.

Correlation IDs are generated at ingress and propagated through service calls, outbox events, and callback processing so a single journey can be reconstructed across components. Transaction IDs are used for payment and booking reconciliation so financial events can be matched across the provider and internal system records.

The risk is not merely missing logs; it is losing sequence. Without consistent correlation and event labeling, the system cannot prove whether a failure was caused by user behavior, provider failure, race conditions, or a deployment regression.

#### Log Schema and Example Logs

Use JSON logs with a fixed envelope so logs can be indexed, queried, and correlated across services.

```json
{
  "timestamp": "2026-04-27T10:15:30.125Z",
  "level": "info",
  "service": "booking-service",
  "environment": "production",
  "correlationId": "c6f3d2df-56b4-4c42-9d7e-2a8c61b1e7d1",
  "requestId": "req-01JX8J6X5Y9N8K",
  "userId": "user_12345",
  "action": "booking.create",
  "entityType": "booking",
  "entityId": "bk_98765",
  "message": "Pending booking persisted",
  "durationMs": 184,
  "httpStatus": 201,
  "errorCode": null,
  "metadata": {
    "showtimeId": "st_7788",
    "seatCount": 3,
    "paymentProvider": "vnpay"
  }
}
```

```json
{
  "timestamp": "2026-04-27T10:16:02.993Z",
  "level": "warn",
  "service": "booking-service",
  "environment": "production",
  "correlationId": "c6f3d2df-56b4-4c42-9d7e-2a8c61b1e7d1",
  "requestId": "req-01JX8J6X5Y9N8K",
  "action": "payment.callback.duplicate",
  "entityType": "payment",
  "entityId": "pay_12345",
  "message": "Duplicate payment callback ignored",
  "durationMs": 31,
  "httpStatus": 200,
  "errorCode": "PAYMENT_CALLBACK_DUPLICATE",
  "metadata": {
    "provider": "vnpay",
    "callbackTxn": "txn_abc123"
  }
}
```

Implementation rule: every log line must contain `timestamp`, `level`, `service`, `correlationId`, `action`, `message`, and either `entityId` or `requestId`. Logs without those fields are considered non-compliant.

### 8.4 Monitoring and Observability

The architecture exports metrics, logs, and traces to a centralized observability stack. This supports anomaly detection, latency analysis, failure classification, and root-cause analysis for booking and payment workflows.

Observability is especially important because the system is distributed and partially asynchronous. The architecture therefore treats trace propagation and telemetry export as first-class cross-cutting requirements rather than optional diagnostics. The mitigation for distributed opacity is to make the system self-describing at runtime.

### 8.5 Caching Strategy

Redis is the primary cache and short-lived coordination store. It is used for read optimization on catalog and showtime data, as well as for seat holds and Pub/Sub fanout.

The read path uses cache-aside behavior with TTLs that preserve freshness while reducing repeated database load. The booking path uses Redis because seat state must be updated with low latency and deterministic contention control. The risk is stale data; the mitigation is bounded TTLs, invalidation through write events, and keeping Redis as an accelerator rather than a source of truth.

### 8.6 Idempotency

Idempotency is a core correctness mechanism. It prevents duplicate booking effects when requests are retried, callbacks are replayed, or background workers resume after failure.

The design uses idempotency keys for payment initiation, uniqueness and state checks for booking transitions, signature validation for callbacks, and durable outbox records to prevent event duplication. The aim is not merely retry safety; it is one business outcome per logical event.

### 8.7 Error Handling and Retry

External dependencies are handled with bounded retries and clear failure reporting. Payment initiation and notifications may be retried with exponential backoff, while booking state changes remain controlled by transactional records and state guards.

The architecture favors fail-fast behavior for unhealthy instances and graceful degradation for external dependencies. Circuit-breaker behavior is conceptually present through isolation and bounded retries, even if the concrete implementation is embedded in service logic or infrastructure support rather than a separate named component.

### 8.8 Security

All public and provider-facing communication uses HTTPS/TLS. Payment callbacks are verified with signatures or secret keys before any state changes are accepted. Sensitive payment data is not stored internally; only the external provider handles sensitive transaction details.

The architecture also minimizes internal attack surface by isolating provider logic behind adapters and by keeping authentication externalized. This reduces the number of places where secrets, tokens, or payment-sensitive logic must be trusted.

#### Security Threats and Boundary Controls

The main threat scenarios are credential stuffing against authentication, replay or spoofing of payment callbacks, privilege escalation through forged roles, and tampering with seat or booking state through client-side manipulation. The controls are boundary validation, server-side authorization, callback signature checks, and minimal trust in client state.

### 8.9 Backup and Restoration

PostgreSQL databases are the system of record and must be backed up using scheduled snapshots and replication-aware backup procedures. The restore path must support service database recovery without cross-service data contamination because each service owns its schema and transactional boundaries.

Restore procedures should prioritize Booking DB recovery because it contains booking, payment, ticket, and outbox state. The restore order is important: restore the authoritative transactional stores first, verify schema and record consistency, then re-enable external integrations after consistency checks and replay validation. The risk is restoring durable state without replay safety; the mitigation is restoration sequencing and validation before reconnecting to providers.

#### Backup and Restore Implementation Rules

- Backup frequency: run PostgreSQL physical backups at least every 15 minutes for the Booking DB and every 60 minutes for other service databases; keep WAL archiving enabled for point-in-time recovery.
- Snapshot retention: keep daily snapshots for 7 days, weekly snapshots for 4 weeks, and monthly snapshots for 6 months unless compliance requires longer.
- Restore order: restore PostgreSQL first, then booking-related tables, then outbox state, then supporting reference data, and only then re-enable payment and notification integrations.
- Post-restore validation: verify row counts, booking state distribution, payment state consistency, and checksum sampling on critical tables before reopening traffic.
- Outbox replay rules: replay only records in a pending or unsent state; mark delivered records idempotently; never replay an event that already produced a confirmed booking or ticket.

## 9. Architecture Decisions (ADR-style)

### ADR-1: Why Microservices Architecture?

**Context:** MovieHub has multiple domain areas with different scaling and reliability characteristics: read-heavy discovery, latency-sensitive booking, external payments, and asynchronous notifications.

**Decision:** Use microservices with service-per-database ownership and explicit inter-service communication.

**Consequences:** The system gains independent scaling, localized change impact, and stronger fault isolation. The cost is increased operational complexity, distributed tracing needs, and more careful handling of cross-service workflows.

### ADR-2: Why API Gateway?

**Context:** Clients need a single entry point for authentication, routing, request aggregation, and WebSocket ingress.

**Decision:** Place an API Gateway in front of domain services and treat it as the public boundary.

**Consequences:** Cross-cutting concerns are centralized and backend services stay focused on domain behavior. The gateway becomes a critical component and must be highly available and carefully bounded.

### ADR-3: Why Redis for Seat Locking?

**Context:** Seat selection requires a fast, short-lived, contention-safe reservation mechanism under high concurrency.

**Decision:** Use Redis locks with TTL for seat holds and Redis cache entries for read optimization.

**Consequences:** Seat reservation becomes fast and bounded by TTL, and lock expiration naturally supports automatic release. The trade-off is that Redis availability and correctness become essential to booking consistency and must be monitored closely.

### ADR-4: Why Outbox Pattern?

**Context:** Booking confirmation must remain durable even when notifications or downstream side effects fail.

**Decision:** Persist integration events in an outbox table within the same transaction as booking changes and publish them asynchronously through a relay worker.

**Consequences:** Booking state and integration events remain consistent, and side effects can be retried safely. The cost is delayed side-effect completion and additional worker/relay operational logic.

### ADR-5: Why Asynchronous Notifications?

**Context:** Notification providers are external and may be slow or unavailable, but notification delivery must not block booking completion.

**Decision:** Dispatch notifications asynchronously via worker processes and provider adapters.

**Consequences:** The booking API remains responsive and the platform can retry notification delivery independently. Users may observe eventual rather than immediate notification arrival, which is acceptable because booking confirmation remains authoritative in the core system.

### ADR-6: Why a Payment Adapter?

**Context:** Multiple payment providers have different APIs, callback models, and failure modes.

**Decision:** Use a canonical payment model inside MovieHub and map provider-specific behavior through a dedicated adapter layer.

**Consequences:** Provider replacement becomes feasible and provider quirks stay out of the booking core. The cost is an extra translation layer and dedicated callback validation logic.

## 10. Quality Requirements

This section intentionally goes deeper than a typical SAD because the drivers and QAS document make the quality attributes explicit. Each subsection follows the same reasoning chain: problem, risk, tactics, decisions, component mapping, trade-offs, failure scenarios, and response measures.

### 10.1 Availability

**Requirement:** Core services must maintain 99.9% monthly uptime and tolerate unhealthy instances without interrupting user-facing flows for more than a few seconds.

**Risk:** A single unhealthy instance, a failed deployment, or a slow external provider can block login, browsing, checkout, or callback completion if the system lacks controlled failover.

**Tactics:** Detect faults using health checks, heartbeat and monitor behavior; remove faulty components from service; use active redundancy; use retry with bounded backoff; degrade gracefully when downstream providers are unavailable.

**Architectural decisions:** Run multiple instances of the gateway and backend services behind a load balancer; validate health at runtime every 10 seconds with 2 second timeout; remove failed instances within 30 seconds; keep external provider calls bounded and recoverable; preserve committed state in PostgreSQL rather than ephemeral nodes.

**Component mapping:** API Gateway replicas, service replicas, Booking Async Worker, load balancer, Clerk integration, payment adapter, notification adapter, PostgreSQL clusters, Redis.

**Trade-offs:** Redundancy raises operational cost and makes deployment more complex, but it avoids single points of failure. Bounded retries improve resiliency but can also increase tail latency if used indiscriminately.

**Failure scenarios:** Gateway pod crash during login; payment gateway timeout during checkout; worker outage during notification dispatch; Redis node failure while real-time seat updates are being published.

**Response measures:** Uptime >= 99.9%; unhealthy instances detected within 10 seconds and removed within 30 seconds; request interruption during failover <= 5 seconds; retry limit 3 attempts with 1s, 2s, and 4s backoff; no loss of committed booking data.

**Implementation Guidelines:**

- In NestJS, expose `/health/live` and `/health/ready` endpoints using application health checks for Redis, PostgreSQL, and external provider reachability.
- Configure Kubernetes or the process manager to keep at least 2 replicas for API Gateway, Booking Service, and other user-facing services.
- Set downstream request timeouts to 2 seconds for health probes and cap total retry time at 10 seconds for transient failures.
- Use readiness probe failure to remove a pod from routing instead of waiting for a crash or manual intervention.
- If Redis is unavailable, keep discovery reads serving from PostgreSQL or cached responses; if booking-critical Redis operations fail, fail closed for seat holding rather than allowing unsafe allocation.

### 10.2 Performance

**Requirement:** Browsing, seat-map loading, and booking initiation must remain responsive under normal and peak load while preserving transactional correctness.

**Risk:** Read-heavy discovery can overload transactional stores; seat contention can create lock storms; external payment latency can inflate checkout time; too much synchronous work in the booking path can reduce conversion.

**Tactics:** Bound execution time, reduce overhead, prioritize critical events, introduce concurrency, maintain multiple copies of data, and control resource demand through pagination and caching.

**Architectural decisions:** Use Redis cache-aside for catalog and showtime reads; enforce pagination with default 10 and maximum 50; push real-time seat updates through Redis Pub/Sub and WebSocket fanout; keep the synchronous booking commit path minimal; isolate payment initiation behind a provider adapter.

**Component mapping:** Movie Service, Cinema Service, Redis cache, API Gateway, Booking Core, Seat Hold Manager, WebSocket path, payment adapter.

**Trade-offs:** Caching improves latency but introduces freshness management. Asynchronous fanout improves responsiveness but requires stronger observability to detect drift. Keeping the booking path minimal improves latency but moves some side effects later in time.

**Failure scenarios:** Redis cache miss storm; 300 concurrent seat actions for the same showtime; payment gateway slower than user-facing budget; large browse query without pagination; hot showtime causing seat contention.

**Response measures:** Cache-hit latency <= 1 second; seat-map load <= 2 seconds for 95% of requests; UI feedback <= 500 ms; server synchronization <= 1 second; browse first page <= 3 seconds for 95% of requests; list operations enforce pagination.

**Implementation Guidelines:**

- Use Redis cache-aside in NestJS services for movie lists, cinema lists, and showtime discovery. Set TTLs to at least 5 minutes for read-heavy data.
- Use database indexes for all list filters and showtime lookups: movie title search, cinema city/district, showtime by cinema/movie, and booking lookup by user/showtime.
- Use shared DTO validation or a request pipe so every list route rejects oversize `limit` values before hitting the service layer.
- Keep seat-hold writes minimal: one Redis lock operation, one booking state write, and one event publish. Do not perform expensive joins or cross-service calls inside the synchronous seat-selection loop.
- Use WebSocket broadcast through the gateway for seat updates, and avoid polling on the client except as a fallback after reconnect.
- When Redis hit rate drops or contention rises, serve discovery reads from PostgreSQL with caching rather than forcing the booking path to absorb read spikes.

### 10.3 Reliability

**Requirement:** Seat holds, booking confirmation, payment callbacks, cancellation, and ticket issuance must produce exactly one durable business outcome per logical event.

**Risk:** Concurrency, retries, duplicate callbacks, and partial failures can create double booking, orphaned payment states, mismatched tickets, or incorrect refunds.

**Tactics:** Use transactions, idempotency, state resynchronization, rollback, exception handling, and lock semantics with TTL.

**Architectural decisions:** Use Redis seat locks with bounded TTL; write pending booking and outbox state transactionally; validate payment callbacks with signatures; ignore duplicate callbacks based on current state; release seats after timeout or failed payment; make ticket issuance contingent on confirmed payment only.

**Component mapping:** Seat Hold Manager, Booking Core, Payment Integration, webhook handler, Booking DB, Redis, Ticket Issuer, outbox table, Async Worker.

**Trade-offs:** Stronger correctness controls reduce throughput and add state checks, but they are necessary because a false positive booking is far more costly than a rejected retry. Idempotency makes retry semantics safe but increases code paths around state lookup.

**Failure scenarios:** Two users hold the same seat at nearly the same time; payment success callback delivered twice; payment timeout after provider has processed the charge; outbox relay crashes after send but before acknowledgment; cancellation request retried by user.

**Response measures:** At most one booking succeeds for a seat; hold TTL <= 5 minutes; release within 1 minute after expiry or failure; exactly one confirmed booking and one ticket set per successful payment; duplicate callbacks do not alter state; no orphan or mismatched booking-payment-ticket records.

**Implementation Guidelines:**

- Use Redis `SET NX PX`-style locking or an equivalent atomic lock primitive with a TTL no greater than 5 minutes for seat holds.
- Write booking status, payment status, and outbox record in the same PostgreSQL transaction when the booking is first created.
- Enforce idempotency keys on booking creation and payment initiation with unique constraints in PostgreSQL, not only in memory.
- In webhook handlers, verify signature first, then load current payment state, then apply a transition only if the current state is still pending or processing.
- Use optimistic state checks and transaction isolation to prevent duplicate confirmations when two callbacks or retries race.
- Release seats through a compensating command that is safe to repeat, and ensure the release path itself is idempotent.

### 10.4 Security

**Requirement:** Authentication, authorization, payment handling, and sensitive data transfer must be protected against unauthorized access and tampering.

**Risk:** Credential stuffing, token replay, callback spoofing, privilege escalation, client-side state tampering, and sensitive-data leakage can compromise bookings and payments.

**Tactics:** Authenticate actors, authorize actors, encrypt data, limit exposure, separate entities, maintain audit trails, detect message delay, and verify message integrity.

**Architectural decisions:** Delegate identity to Clerk; validate tokens at the gateway and service boundary; enforce RBAC server-side; require signed payment callbacks; keep payment provider logic outside the booking core; avoid storing sensitive payment data internally; use HTTPS/TLS for public and provider-facing traffic.

**Component mapping:** Clerk integration, API Gateway auth layer, backend authorization guards, Booking Payment Integration, webhook handler, Web App, observability stack.

**Trade-offs:** Externalizing identity reduces internal credential risk but increases dependency on Clerk availability. Signature validation and RBAC increase request processing work, but they prevent spoofed or unauthorized state transitions.

**Failure scenarios:** Brute-force login attempt; forged payment callback; JWT replay with expired token; admin role misuse; modified seat-selection payload from client.

**Response measures:** 100% of protected requests require valid token; 100% of callbacks are signature-validated; 100% of protected endpoints enforce authorization checks; no sensitive payment data is stored internally; unauthorized access attempts fail closed.

**Implementation Guidelines:**

- Put authentication guards at the API Gateway and again at each backend service for defense in depth; do not rely on gateway-only checks for sensitive mutations.
- Use NestJS guards for RBAC and ownership checks, especially on booking, refund, ticket validation, and admin routes.
- Store payment provider secrets in the deployment secret store, never in source control or shared configuration files.
- Set request timeouts for provider calls to 30 seconds or less and reject retries that exceed the booking window.
- Validate callback signatures before parsing business payloads deeply; if signature verification fails, return a generic acknowledgement and do not touch domain state.
- Log security events with minimal sensitive data: record actor, action, target, outcome, and correlation ID, but never log raw card data, tokens, or secrets.

### 10.5 Maintainability

**Requirement:** Business rules, provider integrations, and operational workflows should change with minimal blast radius.

**Risk:** Shared code paths, weak boundaries, and provider logic embedded in domain services increase regression risk and slow delivery.

**Tactics:** Reduce coupling, split modules, increase cohesion, use intermediaries, abstract common services, defer binding, and refactor safely.

**Architectural decisions:** Keep domain logic inside service boundaries; isolate provider integrations behind adapters; use API Gateway as an intermediary; keep booking orchestration separate from ticket issuance and async side effects; keep service ownership of data explicit.

**Component mapping:** API Gateway, Booking Core, Payment Integration, Async Worker, Movie Service, Cinema Service, User Service, shared Redis utilities.

**Trade-offs:** More modules and adapter layers mean more files and interfaces to maintain, but they localize change and keep high-risk domains isolated. Microservice boundaries make coordination harder, but they stop accidental coupling from spreading across the entire platform.

**Failure scenarios:** Payment provider changes callback schema; new refund rule is introduced; ticket issuance changes; notification provider API changes; booking cancellation policy changes.

**Response measures:** Minor business-rule changes should affect only the owning service; provider changes should be absorbed by adapters; regression scope should stay bounded by automated tests and clear module ownership.

**Implementation Guidelines:**

- Use one NestJS module per bounded capability inside a service, such as booking orchestration, seat hold management, payment integration, and ticket issuance.
- Prefer dependency injection over static helpers so adapters and repositories can be replaced in tests.
- Keep controllers extremely small: parse input, call application service, translate result. Do not place rule branching in controllers.
- Use shared validation pipes and DTOs for shape checks, but keep domain invariants in the service layer.
- Mark provider adapters and external clients as the only layer that knows provider-specific request or response fields.
- When changing business rules, write a focused integration test around the affected service before refactoring supporting code.

### 10.6 Logging and Observability

**Requirement:** Operators must reconstruct booking and payment journeys, diagnose failures, and trace cross-service interactions quickly.

**Risk:** Without correlation IDs, event logs, and method-level context, distributed failures become opaque and post-incident analysis becomes guesswork.

**Tactics:** Maintain audit trail, propagate context, timestamp events, monitor continuously, and detect anomalies early.

**Architectural decisions:** Emit correlation IDs at ingress; propagate them across service calls, callbacks, and outbox processing; log account-level actions, event-level transitions, and method-level failures; export metrics and traces centrally.

**Component mapping:** API Gateway, Booking Service, Async Worker, webhook handler, observability stack, external integration adapters.

**Trade-offs:** More logging increases storage and potential noise, but it is necessary for forensic reconstruction and SLA management. Structured logging adds implementation discipline but removes ambiguity.

**Failure scenarios:** Latency spike in booking path; failed callback processing; payment provider timeout; worker retry loop; deployment regression.

**Response measures:** 100% of user journeys have correlation IDs; 100% of financial transactions are traceable end-to-end; callback linkage accuracy >= 99%; failure cause should be identifiable within 1 minute; alert generation should happen within defined observability thresholds.

**Implementation Guidelines:**

- Standardize logging through a shared NestJS interceptor that injects correlation ID, request metadata, duration, and actor context into every log line.
- Emit logs as single-line JSON only. Avoid free-form multiline logs in production services.
- Ensure the API Gateway creates or forwards `x-correlation-id`, and downstream services copy that value unchanged into logs and events.
- Log at the account level for user-visible actions, at the event level for state transitions, and at the method level only for retries, failures, and boundary decisions.
- Include event types such as `booking.create`, `booking.confirm`, `payment.callback.received`, `payment.callback.duplicate`, `seat.hold.expired`, and `outbox.relay.delivered`.
- Configure log retention to match incident review needs; keep high-cardinality payloads out of logs and attach them to structured metadata only when necessary.

### 10.7 Backup and Restoration

**Requirement:** Transactional data must be recoverable after corruption, operator error, or infrastructure failure.

**Risk:** If backups are incomplete or restore order is wrong, the system can come back with orphaned bookings, mismatched payment state, or invalid tickets.

**Tactics:** Restore, replication, state resynchronization, and controlled restart after verification.

**Architectural decisions:** Use PostgreSQL snapshots and replication-aware backup procedures; restore service-owned databases in dependency order; validate schema and state consistency before reconnecting external integrations; prioritize Booking DB because it contains booking, payment, ticket, and outbox state.

**Component mapping:** PostgreSQL clusters, Booking DB, User DB, Movie DB, Cinema DB, backup tooling, recovery runbooks, observability stack for post-restore verification.

**Trade-offs:** A careful restore process is slower than a simplistic one, but speed without consistency is dangerous. Service-owned recovery boundaries reduce blast radius, but they require explicit coordination during disaster recovery.

**Failure scenarios:** Booking DB loss; partial region outage; corrupted payment records; accidental schema migration; restore after operator error.

**Response measures:** Recovery path must restore transactional correctness before re-enabling provider integrations; restore validation must detect mismatches before traffic resumes; committed transaction data must not be lost during failover; service databases must recover without cross-service contamination.

**Implementation Guidelines:**

- Run automated backups on a schedule: Booking DB every 15 minutes, other service databases hourly, and point-in-time recovery via WAL archiving.
- Restore the Booking DB first because it owns booking, payment, ticket, and outbox state; restore dependent read models or caches only after transactional consistency is verified.
- Validate restored state with a dedicated script that checks representative bookings across all states, payment totals, issued tickets, and outbox delivery markers.
- Replay outbox entries only after restore validation passes and only for records that are known to be undelivered.
- Pause external webhooks during restore and resume them only after the Booking DB has passed consistency checks.
- If a restore reveals mismatched payment-to-booking records, keep the system in read-only or limited-degraded mode until manual reconciliation is completed.

### 10.8 Scalability

**Requirement:** The system must handle peak concurrent browsing and seat selection without forcing a single tier to absorb all traffic.

**Risk:** Shared bottlenecks, especially in Redis, the Booking DB, or the gateway, can create queue buildup and latency spikes under peak load.

**Tactics:** Increase resources, introduce concurrency, maintain multiple copies of data, and bound queue sizes.

**Architectural decisions:** Scale gateway, services, workers, and data tiers independently; keep read traffic cache-backed; keep background jobs separated from user-facing requests.

**Component mapping:** Load balancer, API Gateway, service replicas, Redis, PostgreSQL, Async Worker.

**Trade-offs:** Independent scaling improves efficiency but increases operational management and capacity planning complexity.

**Failure scenarios:** Peak holiday browsing surge; sudden notification backlog; seat-map burst at popular showtime.

**Response measures:** Horizontal scaling should absorb concurrent spikes without violating published latency budgets; background workers should scale without impacting checkout.

**Implementation Guidelines:**

- Deploy API Gateway, Booking Service, and Async Worker with horizontal replicas and autoscaling based on CPU, memory, and queue depth.
- Keep Redis cluster mode or equivalent sharding available for hot-seat or hot-cache pressure if a single Redis node becomes saturated.
- Use separate worker pools for notifications and outbox relay if the backlog characteristics differ materially.
- Limit expensive queries with index-backed pagination and precomputed read models where needed.
- When traffic spikes, scale read-heavy services first, then the gateway, then workers, and only then expand database capacity.

### 10.9 Configurability

**Requirement:** Environment-specific settings, secrets, and provider endpoints must be adjustable without source changes.

**Risk:** Hard-coded configuration causes redeployments for simple environment changes and can leak secrets into code.

**Tactics:** Defer binding, use environment configuration, and abstract external dependencies.

**Architectural decisions:** Read configuration from environment variables or deployment-managed config; keep provider URLs, keys, and feature toggles outside the source tree.

**Component mapping:** Deployment manifests, service startup configuration, CI/CD pipeline, secret storage, provider adapters.

**Trade-offs:** Runtime configuration increases flexibility but requires careful validation to avoid bad startup states.

**Failure scenarios:** Wrong payment endpoint, missing Clerk secret, mismatched environment-specific callback URL.

**Response measures:** Configuration changes should not require code modification or rebuild; invalid configuration must fail fast at startup rather than partially during runtime.

**Implementation Guidelines:**

- Load all environment-specific values from the deployment environment or secret store and validate them on startup.
- Define explicit default values only for safe, non-secret settings such as pagination defaults and log levels.
- Treat timeouts, retry counts, cache TTLs, and replica minimums as configuration, not constants, but keep production defaults aligned with the documented constraints.
- Separate dev, staging, and production config sets so test settings cannot accidentally reach production.

### 10.10 Interoperability

**Requirement:** External systems must be integrated through stable and standardized interfaces.

**Risk:** Provider-specific payloads and callback semantics can leak into the core domain and make provider replacement expensive.

**Tactics:** Tailor interfaces through adapters, standardize protocols, map data, and reduce coupling.

**Architectural decisions:** Use REST/HTTPS for external communication; translate provider-specific payment and notification contracts into canonical internal models; isolate content-provider behavior behind adapters.

**Component mapping:** Payment adapter, notification adapter, content integration logic, API Gateway, booking core.

**Trade-offs:** Adapter layers add translation cost and another place to test, but they preserve core-domain independence.

**Failure scenarios:** Provider adds a field, changes a status code, or changes callback order.

**Response measures:** 100% of outbound integration traffic should pass through adapters; provider-specific logic should not appear inside booking core modules.

**Implementation Guidelines:**

- Encapsulate each provider in a dedicated adapter class or module, such as `VnPayAdapter`, `StripeAdapter`, or `NotificationAdapter`.
- Normalize provider responses into canonical internal models immediately at the boundary.
- Keep provider-specific retry behavior in the adapter layer, but keep business retries in the application layer.
- Use REST/HTTPS for public provider integration unless the provider explicitly requires another secure protocol.
- If a provider schema changes, update only the adapter and contract tests first, then update downstream consumers if the canonical model changes.

### 10.11 Usability

**Requirement:** The booking interface should be intuitive and responsive across desktop and mobile devices.

**Risk:** A technically correct platform still loses customers if seat selection, confirmation, or error states are confusing or slow.

**Tactics:** User guidance, feedback, and clear error handling.

**Architectural decisions:** Keep the UI responsive, use immediate feedback for seat selection, and return clear status for booking and payment states.

**Component mapping:** Web App, WebSocket seat updates, API Gateway, booking endpoints.

**Trade-offs:** Rich feedback increases frontend complexity, but it reduces abandonment and support burden.

**Failure scenarios:** Stale seat map, payment pending state, callback delay, browser reconnect after drop.

**Response measures:** Seat action feedback should remain under the published UI latency budget and the interface should preserve state clarity when a downstream integration is delayed.

**Implementation Guidelines:**

- Return immediate optimistic feedback for seat clicks while the server confirms the final seat state.
- Provide explicit UI states for pending booking, pending payment, payment success, payment failure, and booking expired.
- Use WebSocket reconnect logic on the client so seat maps recover after brief network loss.
- Keep API responses descriptive enough for the frontend to display useful next steps without exposing internal exception detail.

### 10.12 Testability

**Requirement:** Critical services must be testable in isolation and in integration.

**Risk:** If booking rules and integration behavior are not testable, regressions will appear only in production traffic.

**Tactics:** Test interfaces, record/playback, abstract data sources, sandbox environments, and assertions.

**Architectural decisions:** Use dependency injection in NestJS services; keep provider adapters mockable; isolate Booking Core business rules from transport concerns; test callback idempotency and seat contention separately.

**Component mapping:** Booking service modules, gateway boundary, provider adapters, database test setup, integration-test harness.

**Trade-offs:** More seams for testing can introduce architectural overhead, but they make the highest-risk business logic verifiable.

**Failure scenarios:** Duplicate callback handling, lock contention, cancellation logic, payment retry behavior.

**Response measures:** Automated tests should cover the critical booking and payment flows; failures should be detectable in CI before deployment.

**Implementation Guidelines:**

- Use NestJS dependency injection to replace Redis, PostgreSQL, and provider clients with test doubles in unit tests.
- Add integration tests for seat contention, duplicate payment callback handling, booking expiry, cancellation, refund, and outbox replay.
- Use a dedicated test database and a separate Redis namespace for each automated test run.
- Include contract tests for provider adapters so provider payload changes are detected before production.

## Operational Runbook

### Redis Failure Handling

- Check whether Redis is down, partitioned, or merely saturated.
- If Redis is unavailable, keep discovery reads serving from PostgreSQL or precomputed caches where possible, but fail closed for seat-hold operations so no unsafe reservation is created.
- Verify lock TTL behavior after recovery before re-enabling seat operations.
- Clear stale locks only after confirming they correspond to expired or abandoned holds, not active bookings.

### Booking DB Recovery Steps

- Freeze booking mutations and payment callbacks.
- Restore the Booking DB from the latest verified backup or replica snapshot.
- Run consistency validation on booking, payment, ticket, and outbox tables.
- Resume outbox relay only after validation passes.
- Re-enable external callbacks and booking mutations only after the service is back to ready state and the database passes integrity checks.

### Payment Provider Downtime Strategy

- Retry transient errors with bounded exponential backoff only within the booking window.
- If retries are exhausted, return a recoverable pending-payment status instead of forcing a second checkout path.
- Keep webhook handlers available even when the provider is down so late callbacks can still reconcile state.
- Escalate to support and operations when provider outages exceed the configured SLA or backlog threshold.

### Outbox Backlog Handling

- Monitor pending outbox count and age.
- If backlog grows, scale the Async Worker horizontally before changing the booking path.
- Reprocess stuck outbox items idempotently; do not manually delete records unless they are confirmed duplicates.
- Prioritize booking-confirmation-related events over low-priority notifications if the queue must be drained in phases.

### High Traffic Mitigation

- Increase gateway and read-service replicas first.
- Check Redis cache hit rate and hot key pressure.
- Ensure pagination and query limits are still being enforced.
- Temporarily degrade non-essential features such as analytics refresh or notification resend if checkout latency is threatened.
- If booking pressure remains high, reduce external retry aggressiveness to protect the critical path.

## 11. Risks & Technical Debt

### 11.1 Redis Failure or Inconsistency Risks

Redis is central to caching, seat locking, and Pub/Sub. If Redis is unavailable or TTL behavior is misconfigured, seat holds may expire incorrectly, lock acquisition may fail, or real-time updates may lag.

This is a deliberate dependency risk. The mitigation is to monitor Redis health, validate expiration semantics, and ensure booking recovery paths tolerate transient Redis issues without corrupting durable booking records.

### 11.2 Payment Provider Downtime

Payment gateways are outside MovieHub control and may timeout, reject, or replay callbacks. This can delay booking completion and generate recovery work.

The architecture reduces this risk through bounded retries, idempotent callbacks, and canonical payment state handling. Nevertheless, provider downtime remains a business risk that can temporarily reduce checkout conversion.

### 11.3 Eventual Consistency Issues

The use of asynchronous side effects means that notifications, event propagation, and some user-visible updates are eventually consistent rather than immediately consistent.

The architectural control is that the authoritative booking state remains consistent in the Booking DB, while all delayed side effects are derived from durable records. This trade-off must be understood by operations and product teams.

### 11.4 Scaling Limitations

Microservices scale well when boundaries are correct, but distributed systems also create coordination overhead. The booking path is sensitive to lock contention, database throughput, and real-time fanout load.

Scaling bottlenecks may appear in Redis, the Booking DB, or the gateway layer before the rest of the system saturates. Capacity planning must therefore include those shared hotspots and not only average-request throughput.

### 11.5 Operational Complexity of Microservices

Microservices require more deployment coordination, observability discipline, version compatibility management, and incident response maturity than a monolith.

This complexity is accepted because the business and quality requirements demand it. However, it becomes technical debt if not supported by clear runbooks, strong telemetry, consistent deployment automation, and disciplined boundary ownership.

## 12. Glossary

- **Booking lifecycle states**: The major booking states are typically PENDING, CONFIRMED, CANCELED, EXPIRED, and FAILED. These states control whether tickets can be issued or seats can be released.
- **Seat Hold**: A temporary TTL-based reservation for a seat, usually created before payment confirmation so other users cannot claim the same seat.
- **Idempotency**: A property that allows repeated requests or callbacks to produce the same business result as a single execution.
- **Outbox pattern**: A pattern in which integration events are stored in the same transaction as domain changes and later published by a background relay.
- **Payment callback / webhook**: A provider-initiated HTTP callback that informs MovieHub of payment success, failure, or other settlement outcomes.
- **Redis Pub/Sub**: Redis messaging used here for low-latency propagation of seat and booking updates to real-time channels.
- **Microservice boundaries**: The explicit ownership lines between independently deployable services, each owning its data and responsibilities.
- **Correlation ID**: A request or journey identifier propagated across services and asynchronous events so a full flow can be traced end-to-end.

---

### Source References

- ADD decisions and rationale: [docs/architecture/add.md](../add.md)
- Quality attribute drivers: [docs/architecture/drivers.md](../drivers.md)
- Quality attribute scenarios: [docs/architecture/QAS.md](../QAS.md)
- Tactics catalogue: [docs/architecture/tactics.md](../tactics.md)
- Constraints: [docs/architecture/constrain.md](../constrain.md)
- C4 context: [docs/architecture/c4/c4-context.md](../c4/c4-context.md)
- C4 containers: [docs/architecture/c4/c4-containers.md](../c4/c4-containers.md)
- C4 Booking components: [docs/architecture/c4/c4-components-booking.md](../c4/c4-components-booking.md)
- C4 deployment: [docs/architecture/c4/c4-deployment.md](../c4/c4-deployment.md)
- C4 booking flow: [docs/architecture/c4/c4-dynamic-booking.md](../c4/c4-dynamic-booking.md)
- C4 payment callback flow: [docs/architecture/c4/c4-dynamic-payment-callback.md](../c4/c4-dynamic-payment-callback.md)
- C4 real-time seat update flow: [docs/architecture/c4/c4-dynamic-realtime-seat-update.md](../c4/c4-dynamic-realtime-seat-update.md)
- C4 async outbox processing: [docs/architecture/c4/c4-dynamic-outbox-processing.md](../c4/c4-dynamic-outbox-processing.md)
- C4 architecture guide: [docs/architecture/c4-architecture/README.md](../c4-architecture/README.md)
- C4 syntax reference: [docs/architecture/c4-architecture/references/c4-syntax.md](../c4-architecture/references/c4-syntax.md)
- C4 advanced patterns: [docs/architecture/c4-architecture/references/advanced-patterns.md](../c4-architecture/references/advanced-patterns.md)
- C4 common mistakes: [docs/architecture/c4-architecture/references/common-mistakes.md](../c4-architecture/references/common-mistakes.md)
