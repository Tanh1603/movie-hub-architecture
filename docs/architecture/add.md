![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4XmP4//8/AwAI/AL+GwXmLwAAAABJRU5ErkJggg==)![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4XmP4//8/AwAI/AL+GwXmLwAAAABJRU5ErkJggg==)

**Table of content**

[**1\. Design Constraints 4**](#_heading=h.ewm8tjyolt7i)

[**2\. Quality Attribute Requirements 5**](#_heading=h.j0p4ts50mttr)

[2.1. Security 5](#_heading=h.v78qv0fsecfq)

[2.1.1. Secure Authentication & Session Protection 5](#_heading=h.d0izmaibinqd)

[2.1.2. Authorization & Access Control Enforcement 6](#_heading=h.ayqfkt834jcg)

[2.1.3. Secure Payment Processing & External Integration Protection 7](#_heading=h.hig2udedcoyh)

[2.2. Performance 8](#_heading=h.5ze1llyajdxn)

[2.2.1. Read-Heavy Workload Handling 8](#_heading=h.gg3ysot31sqm)

[2.2.2. High-Concurrency State Update 9](#_heading=h.u2jdknaistpq)

[2.2.3. Critical Commit Path 9](#_heading=h.kcidp41ntmet)

[2.3. Usability 10](#_heading=h.tq72o0kaywgv)

[2.3.1. Smooth User Experience 10](#_heading=h.ptxvqr338ciy)

[2.3.2. Easy-to-Use Interface 11](#_heading=h.p1c274tx6hqp)

[2.4. Interoperability 11](#_heading=h.gwp2pc2n6ff7)

[2.4.1. Payment Gateway Interoperability 11](#_heading=h.tjpazjtxp8ag)

[2.4.2. Notification Provider Interoperability 12](#_heading=h.x574481fgbft)

[2.4.3. Movie Metadata Interoperability 13](#_heading=h.rm5q4bdaig4g)

[2.5. Modifiability 14](#_heading=h.40bb4iks1xt)

[2.5.1. Supporting Business Requirement Changes 14](#_heading=h.pzauhy7taoxr)

[2.5.2. Zero-Downtime Updates 15](#_heading=h.jt7kcj7f9fb4)

[2.6. Availability 15](#_heading=h.svksc75vl0u1)

[2.6.1. Core Access Continuity 15](#_heading=h.281z0sixbjmg)

[2.6.2. External Dependency Failure Handling 16](#_heading=h.rs1xevfaos6z)

[2.6.3. Operational Continuity Under Failover 17](#_heading=h.qno5mzv9u6l8)

[2.7. Reliability 17](#_heading=h.bdkzeuu7wv3w)

[2.7.1. Concurrent Shared-Resource Consistency 17](#_heading=h.duma62hdk473)

[2.7.2. Distributed Commit Consistency 18](#_heading=h.a22zzvmbvp8p)

[2.7.3. External Reconciliation Idempotency 19](#_heading=h.63x87i45844q)

[2.7.4. Cancellation and Compensation Integrity 19](#_heading=h.s8us5n8ru5q4)

[2.8. Auditability / Observability 20](#_heading=h.tisimbs2gz31)

[2.8.1. End-to-End User Journey Traceability 20](#_heading=h.geccffz0rsba)

[2.8.2. Financial Transaction Observability 21](#_heading=h.8blos9w1v90x)

[2.8.3. System & Integration Observability 21](#_heading=h.hbj189j8l4c9)

[2.9. Scalability 22](#_heading=h.bu4mr338yc19)

[2.9.1. Concurrent User Handling 22](#_heading=h.6p3wgz3wta4w)

[2.9.2. Background Job Scaling 22](#_heading=h.b23nynn603fc)

[2.9.3. Data Growth Handling 23](#_heading=h.xi2oza1vgfkv)

[2.10. Configurability 24](#_heading=h.eolqrllahsb5)

[2.10.1. Environment Configuration 24](#_heading=h.807a9ctmki07)

[2.11. Maintainability 24](#_heading=h.vvil5mn0363r)

[2.11.1. Adding New Features 24](#_heading=h.fd5juo3szog9)

[2.11.2. Bug Fixing 25](#_heading=h.1bkdkn7nv2ss)

[2.11.3. Code Refactoring 25](#_heading=h.wpq0jux2tr35)

[2.11.4. Testability 26](#_heading=h.ky2f2hz8lw5f)

[**3\. Architectural Representation 26**](#_heading=h.y69tj0ql371k)

[3.1. Logical View 26](#_heading=h.8q04hvbafyop)

[3.2. Implementation View 27](#_heading=h.o3ze1u4jvmtm)

[3.3. Deployment View 27](#_heading=h.avgza08fn3d6)

[3.4. Data View 28](#_heading=h.g07ciy14b2z3)

# **Design Constraints**

- **Scalability**: The system must support thousands of concurrent users during peak times, such as holidays or promotional periods.
- **Performance**: The system must handle normal load (~100 req/s) with transaction-oriented APIs responding within 2 seconds for at least 95% of requests, and support peak load (~300 req/s) where read-heavy APIs such as browsing and search respond within 3 seconds (and within 2 seconds under normal load). High-concurrency interactions must maintain responsive behavior with seat-map loading within 2 seconds (p95), user action feedback within 500 ms, and state synchronization within 1 second. Read-heavy data paths must leverage caching with a TTL of at least 5 minutes and cache-hit latency within 1 second. All list and query operations must enforce pagination (default 10 items, maximum 50 items) while maintaining p95 latency within 2 seconds.
- **Security**: The system must enforce secure authentication and authorization using token-based mechanisms (e.g., JWT), encrypt all sensitive data in transit (HTTPS/TLS) and at rest, prevent unauthorized access through RBAC, and mitigate attacks such as brute-force login and data exposure.
- **Availability**: Core business services must achieve at least 99.9% monthly uptime and run with a minimum of two active instances behind a load balancer. The system must perform health checks at intervals of no more than 10 seconds with a timeout of 2 seconds, and remove failed instances from routing within 30 seconds. Failover should not interrupt requests for more than 5 seconds. External dependencies must be handled using bounded retries (maximum 3 attempts with exponential backoff of 1s, 2s, and 4s, totaling no more than 10 seconds), combined with graceful degradation to prevent system-wide failure. No committed transaction data loss is allowed during failover.
- **Reliability:** The system must ensure reliability through idempotent processing of booking and payment operations, guaranteeing exactly-once effects under retries. Concurrent operations on shared resources such as seat reservations must guarantee that at most one allocation succeeds, using lock semantics with a bounded TTL of no more than 10 minutes. Held resources must be automatically released within 1 minute after expiration or failed operations. A successful payment must result in exactly one booking confirmation and corresponding ticket issuance, while failed or timed-out payments must not produce any tickets. The system must maintain strong consistency across distributed operations, ensuring no orphan or mismatched transactions, with financial reconciliation variance not exceeding 0.01%. Conflict detection, such as schedule overlap, must complete within 2 seconds for at least 95% of requests with zero accepted conflicts.
- **Modifiability**: Architecture must support independent microservice updates and allow for fast business logic modifications.
- **Interoperability**: The system must integrate with external services (e.g., payment gateways, notification providers, and content providers) using standardized protocols (REST/HTTPS), and isolate third-party dependencies through adapter layers and canonical data models to ensure compatibility and consistency.
- **Usability**: Interfaces should be intuitive and responsive, supporting responsive design across desktop and mobile.
- **Observability:** The system must provide end-to-end traceability for all critical flows (e.g., user journey, booking, payment, and external integrations) using correlation IDs, structured logging, distributed tracing, and real-time monitoring, enabling detection and diagnosis of failures within a bounded time.

# **Quality Attribute Requirements**

### Security

### Secure Authentication & Session Protection

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A user attempts to register, log in, or reset password using credentials and OTP verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Stimulus source  | End user (web/mobile client)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Environment      | Public internet, production system, potentially exposed to brute-force or credential stuffing attacks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Artifact         | Authentication layer (Clerk), API Gateway, Backend Auth Middleware                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Response         | The system delegates authentication to Clerk, which securely handles credential validation, password hashing, OTP generation, and session issuance. After successful authentication, the backend validates the issued JWT/session token on every request. Tokens are verified for signature, expiration, issuer, and audience. For sensitive operations (e.g., payment), the system enforces additional OTP verification. Failed login attempts are tracked per account and per IP, and temporary lockout is triggered when thresholds are exceeded. No sensitive information (e.g., whether username exists) is revealed in error responses. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Response measure | \- 100% of API requests require valid JWT/session token (except public endpoints)- Token validation latency ≤ 50 ms per request- OTP verification required for 100% of high-risk actions (e.g., payment)- Failed login attempts limited to ≤ 5 attempts before temporary lockout- Lockout duration ≥ 5 minutes after threshold breach- 0% exposure of sensitive identity information in error messages                                                                                                                                                                                                                                        |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Authorization & Access Control Enforcement

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | A user attempts to access or modify a protected resource (e.g., view booking, select seats, modify account, admin action)                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Stimulus source  | Authenticated user or internal admin                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Environment      | Production system with multiple roles (customer, admin, system service)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Artifact         | Backend services, RBAC module, API endpoints                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Response         | The system enforces role-based access control (RBAC) at the backend layer. Each request is evaluated against the user's role and permissions before execution. Authorization rules define which roles can access which resources and actions. For example, customers can only access their own bookings, while admins can manage system-wide data. Unauthorized requests are rejected with a generic error response. Authorization checks are performed at every protected endpoint and cannot be bypassed by frontend manipulation. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Response measure | \- 100% of protected endpoints enforce authorization checks- Unauthorized access attempts rejected in ≤ 100 ms- 0% access to resources outside user ownership- 100% of admin actions require elevated role validation- No sensitive data leakage in unauthorized responses                                                                                                                                                                                                                                                           |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Secure Payment Processing & External Integration Protection

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A user initiates a payment through an external payment gateway (VNPay, MoMo, Stripe, etc.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Stimulus source  | Authenticated user during checkout                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Environment      | Distributed system interacting with external third-party services over public networks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Artifact         | Payment Service, Payment Gateway Adapter, API Gateway                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Response         | The system processes payment requests through a secure adapter layer that communicates with external gateways using HTTPS and signed requests. Sensitive payment data is never stored in the system and is handled only by the external provider. The system validates all callbacks/webhooks from payment providers using signatures or secret keys to prevent spoofing. Each payment request includes an idempotency key to prevent duplicate transactions. Timeout rules are enforced (≤ 30 seconds), and failed or delayed responses are handled safely without exposing system inconsistencies. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Response measure | \- 100% of external communication uses HTTPS (TLS encryption)- 100% of payment callbacks validated via signature verification- Idempotency enforced for 100% of payment requests- Payment timeout ≤ 30 seconds- 0% storage of sensitive payment data in internal system- Duplicate transaction rate ≤ 0.1%                                                                                                                                                                                                                                                                                           |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Performance

### Read-Heavy Workload Handling

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Open the catalog, apply filters, search nearby cinemas, or load active showtimes during normal browsing load.                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                          |
| Stimulus source  | Guest or Member via web client/API entry point.                                                                                                                                                                                                                                                                                              |
| ---              | ---                                                                                                                                                                                                                                                                                                                                          |
| Environment      | 100 requests/second normal traffic, with read-heavy traffic and standard pagination.                                                                                                                                                                                                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                                                                                          |
| Artifact         | Read models, query endpoints, and cache-backed discovery data.                                                                                                                                                                                                                                                                               |
| ---              | ---                                                                                                                                                                                                                                                                                                                                          |
| Response         | The system serves repeated reads from cached or precomputed data when available, keeps page size bounded, and returns the first result page without waiting on slower write-side operations. When read pressure increases, it continues serving from replicated or cached read data rather than forcing each request through the write path. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                          |
| Response measure | First page response time is <= 3 seconds for 95% of requests and <= 4 seconds for 99% of requests; filtered/search/showtime list responses are <= 2 seconds for 95% of requests; cache hits are <= 1 second; default page size is 10 and maximum page size is 50.                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                          |

### High-Concurrency State Update

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Select or deselect a seat while multiple users are interacting with the same showtime.                                                                                                                                                                                                                                                                                        |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Stimulus source  | Authenticated users (Member).                                                                                                                                                                                                                                                                                                                                                 |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Environment      | About 300 concurrent seat actions on the same showtime.                                                                                                                                                                                                                                                                                                                       |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Artifact         | Real-time seat selection path, seat state store, and broadcast channel.                                                                                                                                                                                                                                                                                                       |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Response         | The system updates seat status immediately for the caller, synchronizes the seat state to other clients quickly, and rejects stale or conflicting actions without waiting for slower background work. When contention increases, it keeps the caller responsive by committing only the minimal state change needed and broadcasting the new state to the rest of the clients. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Response measure | Seat state load is <= 2 seconds for 95% of requests and <= 3 seconds for 99% of requests; UI feedback is <= 500 ms; server synchronization completes within <= 1 second.                                                                                                                                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |

### Critical Commit Path

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Confirm a booking from held seats and initiate payment for a pending booking.                                                                                                                                                                                                                                     |
| ---              | ---                                                                                                                                                                                                                                                                                                               |
| Stimulus source  | Authenticated users (Member).                                                                                                                                                                                                                                                                                     |
| ---              | ---                                                                                                                                                                                                                                                                                                               |
| Environment      | Active booking window, held seats in place, external payment gateway required.                                                                                                                                                                                                                                    |
| ---              | ---                                                                                                                                                                                                                                                                                                               |
| Artifact         | Booking service, cinema seat reservation state, payment initiation path.                                                                                                                                                                                                                                          |
| ---              | ---                                                                                                                                                                                                                                                                                                               |
| Response         | The system validates the held seats, commits the booking record once, creates a pending payment record, and returns the payment redirect path without letting the booking expire or duplicate. If a request is retried, the system reuses the existing pending state rather than creating a second checkout path. |
| ---              | ---                                                                                                                                                                                                                                                                                                               |
| Response measure | The commit path completes within <= 3 seconds for 95% of requests and <= 5 seconds for 99% of requests; the booking remains valid within the 15-minute hold window; repeated requests do not create duplicate pending state.                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                                               |

### Usability

### Smooth User Experience

| **Element**      | **Statement**                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | Users perform booking-related actions: search flights, select seats, add baggage, complete payment.                                                                                        |
| ---              | ---                                                                                                                                                                                        |
| Stimulus source  | Customers, Support Staff.                                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                        |
| Environment      | During normal use across various devices and browsers.                                                                                                                                     |
| ---              | ---                                                                                                                                                                                        |
| Artifact         | Frontend UI (Next.js, Tailwind CSS, Material UI), booking workflows, backend APIs.                                                                                                         |
| ---              | ---                                                                                                                                                                                        |
| Response         | Intuitive UI using modern components.Minimized steps in booking process with clear guidance.Client-side validation and error feedback.Responsive design across devices.                    |
| ---              | ---                                                                                                                                                                                        |
| Response measure | \>= 95% users complete booking on first attempt.Booking flow time &lt; 5 minutes for experienced users.&gt;= 80% form input errors caught on client-side.User satisfaction rating >= 8/10. |
| ---              | ---                                                                                                                                                                                        |

### Easy-to-Use Interface

| **Element**      | **Statement**                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Users interact with menus, buttons, forms, seat maps, calendars.                                                                                                                            |
| ---              | ---                                                                                                                                                                                         |
| Stimulus source  | Customers, Support Staff, Airline Staff, Admins.                                                                                                                                            |
| ---              | ---                                                                                                                                                                                         |
| Environment      | On desktop, tablet, and mobile devices.                                                                                                                                                     |
| ---              | ---                                                                                                                                                                                         |
| Artifact         | UI components built with Next.js, Tailwind CSS, Material UI.                                                                                                                                |
| ---              | ---                                                                                                                                                                                         |
| Response         | Consistent design across pages.Key functions are prominent and accessible.Plain language, minimal jargon.Visual cues and instant feedback for user actions.                                 |
| ---              | ---                                                                                                                                                                                         |
| Response measure | Avg time to find/understand a function &lt; 1 minute.<= 5% users need support for basic tasks.Click steps for common tasks optimized.&gt;= 90% users complete usability tests successfully. |
| ---              | ---                                                                                                                                                                                         |

### Interoperability

### Payment Gateway Interoperability

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A user initiates a payment for a booking using an external payment provider such as VNPay, MoMo, or Stripe.                                                                                                                                                                                                                                                                                                                                                                             |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Stimulus source  | End user via the checkout flow.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Environment      | The production system is processing bookings and communicating with third-party payment gateways over public networks.                                                                                                                                                                                                                                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Artifact         | Payment Service, Gateway Adapter Layer, API Gateway, Webhook Handler.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Response         | The system sends all payment requests through a dedicated adapter layer that transforms internal payment requests into provider-specific formats and protocols. Incoming callbacks or webhooks from providers are validated and translated into a canonical internal payment status model such as pending, successful, failed, expired, or refunded. The booking core interacts only with this canonical model and is isolated from provider-specific APIs, payloads, and SDK behavior. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Response measure | 100% of outbound payment communication uses secure standardized protocols; 100% of valid provider callbacks are validated before processing; 100% of provider responses are normalized into the internal payment status model before reaching core services; no provider-specific API logic exists inside core booking modules; payment timeout is enforced at 30 seconds or less.                                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Notification Provider Interoperability

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | The system must send booking confirmations, e-tickets, reminders, or resend messages through external email or SMS providers.                                                                                                                                                                                                                                                                                                                           |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Stimulus source  | Booking completion workflow, resend request, or scheduled reminder workflow.                                                                                                                                                                                                                                                                                                                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Environment      | The production system is interacting with multiple third-party notification providers that expose different APIs, payload formats, and delivery-response models.                                                                                                                                                                                                                                                                                        |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Artifact         | Notification Service, Message Queue, Provider Adapter Layer, Ticket Delivery Module.                                                                                                                                                                                                                                                                                                                                                                    |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Response         | The system publishes notification tasks asynchronously and routes them through a provider adapter layer. Each adapter converts the internal notification command into the provider-specific request format and translates provider responses into a standardized internal delivery status model such as queued, sent, delivered, failed, or retryable failure. Core booking and ticketing services do not depend on any provider-specific API contract. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Response measure | 100% of outbound notification requests pass through the adapter layer; 100% of provider responses are mapped into the standardized delivery status model; the main booking API response is not blocked by notification-provider latency in normal operation; no provider-specific delivery logic appears in core booking or ticketing services; provider failure handling is consistent across supported providers in at least 95% of cases.            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Movie Metadata Interoperability

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | The system retrieves movie information such as ratings, synopsis, media assets, or cast data from external content providers such as TMDB or IMDb.                                                                                                                                                                                                                                                                                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Stimulus source  | User browsing flow or scheduled synchronization process.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Environment      | The production system depends on external content providers whose schemas, response structures, and availability characteristics may differ.                                                                                                                                                                                                                                                                                                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Artifact         | Content Integration Service, Metadata Adapter Layer, Cache Layer, Movie Catalog Service.                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Response         | The system retrieves external movie data through integration adapters that map provider-specific responses into a canonical internal movie metadata model. Differences in schema, field naming, and transport format are handled entirely inside the adapter layer. If a provider is unavailable, slow, or returns incomplete data, the system serves cached or fallback data so that the core movie browsing experience remains functional and independent of provider-specific failures.              |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Response measure | 100% of accepted external responses are transformed into the canonical internal schema before entering core services; no provider schema mismatch propagates into core catalog logic; external provider failure does not make the core movie-browsing function unavailable in normal fallback cases; mapping failures are traceable to the originating provider response in 100% of logged failures; cached fallback is available for at least 95% of read requests during temporary provider downtime. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Modifiability

### Supporting Business Requirement Changes

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | A change in business logic (e.g., refund policy, new ticket types), new feature requests, or updates to existing workflows.                                                                                                                                                                                                                                              |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                      |
| Stimulus source  | Business stakeholders, product development team.                                                                                                                                                                                                                                                                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                      |
| Environment      | During development or maintenance phases.                                                                                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                      |
| Artifact         | Business logic microservices (Node.js, Spring Boot), databases (PostgreSQL, MongoDB), frontend (Next.js).                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                      |
| Response         | Microservice architecture allows localized changes to specific services.High cohesion and loose coupling in service design.Flexible design patterns (e.g., Strategy, Rule Engine) for business logic variability.Centralized config management for adjustable business parameters.Well-documented APIs and comprehensive automated testing to ensure minimal regression. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                      |
| Response measure | Avg time to implement minor business rule change < 1 week.Number of services affected by common changes ≤ 2.Regression rate after updates ≤ 1%                                                                                                                                                                                                                           |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                      |

### Zero-Downtime Updates

| **Element**      | **Statement**                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A new version of a microservice, configuration update, or security patch needs to be deployed.                                                                                |
| ---              | ---                                                                                                                                                                           |
| Stimulus source  | DevOps or development team.                                                                                                                                                   |
| ---              | ---                                                                                                                                                                           |
| Environment      | Production environment with active users.                                                                                                                                     |
| ---              | ---                                                                                                                                                                           |
| Artifact         | Microservices (Node.js, Spring Boot), deployment infrastructure, API Gateway.                                                                                                 |
| ---              | ---                                                                                                                                                                           |
| Response         | Apply zero-downtime deployment strategies (e.g., blue-green deployment).Use automated deployment tools and CI/CD pipelines.Monitor health checks and rollback on failure.     |
| ---              | ---                                                                                                                                                                           |
| Response measure | \>= 99% of updates cause no user-visible disruption.Rolling update of a service completes in < 30 minutes.Rollback to previous version completes within 10 minutes if needed. |
| ---              | ---                                                                                                                                                                           |

### Availability

### Core Access Continuity

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Submit login or token-validation requests while one or more core instances are unhealthy.                                                                                                                                                                                                                                 |
| ---              | ---                                                                                                                                                                                                                                                                                                                       |
| Stimulus source  | Guest, Member, Admin, or Cinema Manager                                                                                                                                                                                                                                                                                   |
| ---              | ---                                                                                                                                                                                                                                                                                                                       |
| Environment      | Monthly core-service uptime target, health-check driven routing, and at least two service instances behind the load balancer.                                                                                                                                                                                             |
| ---              | ---                                                                                                                                                                                                                                                                                                                       |
| Artifact         | Authentication path at the API boundary and identity service.                                                                                                                                                                                                                                                             |
| ---              | ---                                                                                                                                                                                                                                                                                                                       |
| Response         | The system routes around unhealthy instances, keeps authentication reachable, and fails fast when an instance does not respond instead of stalling the entire login flow. If a node becomes unhealthy, traffic shifts away and requests continue on the remaining healthy instance without requiring a full service stop. |
| ---              | ---                                                                                                                                                                                                                                                                                                                       |
| Response measure | Core services maintain uptime >= 99.9% monthly; unhealthy instances are detected within 10 seconds and removed within 30 seconds; request interruption during failover is <= 5 seconds; failover should keep the user-visible interruption p95 under 3 seconds.                                                           |
| ---              | ---                                                                                                                                                                                                                                                                                                                       |

### External Dependency Failure Handling

| **Element**      | **Statement**                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Start payment for a booking while the external payment gateway times out or returns an error.                                                                                                                                                                             |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Stimulus source  | Authenticated users (Member).                                                                                                                                                                                                                                             |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Environment      | External dependency failure, retry window, and booking still inside the payment eligibility period.                                                                                                                                                                       |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Artifact         | Payment initiation path and external gateway integration.                                                                                                                                                                                                                 |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Response         | The system retries the external call a limited number of times, keeps the checkout flow alive, and returns a clear status if the gateway remains unavailable. If the gateway stays down, the booking remains in a recoverable state instead of failing the entire flow.   |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Response measure | Retry occurs up to 3 times with backoff of 1s, 2s, and 4s; total retry time does not exceed 10 seconds; user-visible response remains within 3 seconds for 95% of requests and 5 seconds for 99% of requests; the booking remains recoverable after a downstream timeout. |
| ---              | ---                                                                                                                                                                                                                                                                       |

### Operational Continuity Under Failover

| **Element**      | **Statement**                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | Receive a payment callback or validate a ticket while an application instance or database replica is unhealthy.                                                                                                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                  |
| Stimulus source  | VNPay gateway or Staff                                                                                                                                                                                                                                                               |
| ---              | ---                                                                                                                                                                                                                                                                                  |
| Environment      | Peak traffic, public callback traffic, and failover conditions.                                                                                                                                                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                  |
| Artifact         | Payment callback path, booking update path, and ticket validation path.                                                                                                                                                                                                              |
| ---              | ---                                                                                                                                                                                                                                                                                  |
| Response         | The system continues accepting valid callbacks and validation requests, avoids losing committed state, and shifts traffic away from failed instances without breaking the workflow. The callback path remains idempotent so a retried notification does not replay business effects. |
| ---              | ---                                                                                                                                                                                                                                                                                  |
| Response measure | Health checks run every 10 seconds with <= 2 seconds timeout; unhealthy nodes are removed within 30 seconds; committed transactions are not lost; gate validation remains available during peak entry periods; callback replay does not duplicate business effects.                  |
| ---              | ---                                                                                                                                                                                                                                                                                  |

### Reliability

### Concurrent Shared-Resource Consistency

| **Element**      | **Statement**                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | Two or more users attempt to hold the same seat at nearly the same time.                                                                                                                                     |
| ---              | ---                                                                                                                                                                                                          |
| Stimulus source  | Member                                                                                                                                                                                                       |
| ---              | ---                                                                                                                                                                                                          |
| Environment      | At least 2 concurrent requests for the same seat within the active showtime window.                                                                                                                          |
| ---              | ---                                                                                                                                                                                                          |
| Artifact         | Real-time seat hold state and per-seat reservation records.                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                                          |
| Response         | The system allows only one seat hold to succeed, rejects the conflicting request immediately, and expires the seat hold automatically if payment is not completed in time.                                   |
| ---              | ---                                                                                                                                                                                                          |
| Response measure | At most 1 booking succeeds for the seat; hold TTL is <= 5 minutes; release occurs within <= 1 minute after expiry or payment failure; conflicting requests are rejected deterministically under concurrency. |
| ---              | ---                                                                                                                                                                                                          |

### Distributed Commit Consistency

| **Element**      | **Statement**                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Complete payment successfully, retry a payment request, or receive a duplicate callback.                                                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Stimulus source  | Member and VNPay gateway                                                                                                                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Environment      | Retry conditions, callback duplication, and timeout handling after payment submission.                                                                                                                                                                                    |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Artifact         | Booking record, payment record, and generated ticket set.                                                                                                                                                                                                                 |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Response         | The system records the payment result once, confirms exactly one booking, generates the corresponding tickets once, and does not publish tickets when the payment does not complete successfully.                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                       |
| Response measure | Exactly one confirmed booking and one ticket set are produced for a successful payment; retries do not duplicate effects; failed or timed-out payment returns the seat within <= 1 minute; partial failures do not leave booking, payment, and issued state inconsistent. |
| ---              | ---                                                                                                                                                                                                                                                                       |

### External Reconciliation Idempotency

| **Element**      | **Statement**                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Deliver the same callback more than once or deliver a callback after the initial result has already been processed.                                                        |
| ---              | ---                                                                                                                                                                        |
| Stimulus source  | VNPay gateway                                                                                                                                                              |
| ---              | ---                                                                                                                                                                        |
| Environment      | Public callback traffic, duplicate delivery, and late-arriving notifications.                                                                                              |
| ---              | ---                                                                                                                                                                        |
| Artifact         | Callback handling path, payment state, and booking state.                                                                                                                  |
| ---              | ---                                                                                                                                                                        |
| Response         | The system verifies the callback once, ignores duplicate delivery safely, and leaves the already-processed result unchanged while still returning a valid acknowledgment.  |
| ---              | ---                                                                                                                                                                        |
| Response measure | Duplicate callbacks do not change state; callback processing completes within the same 3-second response window; no orphaned or duplicate payment transitions are created. |
| ---              | ---                                                                                                                                                                        |

### Cancellation and Compensation Integrity

| **Element**      | **Statement**                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | Cancel a booking with refund requested near or before the refund cutoff time.                                                                                                                                |
| ---              | ---                                                                                                                                                                                                          |
| Stimulus source  | Member                                                                                                                                                                                                       |
| ---              | ---                                                                                                                                                                                                          |
| Environment      | Booking is eligible or ineligible based on time and status, with possible retry on submission.                                                                                                               |
| ---              | ---                                                                                                                                                                                                          |
| Artifact         | Booking state and refund request record.                                                                                                                                                                     |
| ---              | ---                                                                                                                                                                                                          |
| Response         | The system cancels only eligible bookings, creates exactly one refund request when allowed, and prevents repeated requests from creating duplicate refund records.                                           |
| ---              | ---                                                                                                                                                                                                          |
| Response measure | Cancellation is allowed only for PENDING or CONFIRMED bookings; cancellation for refund must be at least 2 hours before showtime; refund amount is 70% of the ticket price; refund record starts as PENDING. |
| ---              | ---                                                                                                                                                                                                          |

### Auditability / Observability

### End-to-End User Journey Traceability

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A user performs a full journey including registration/login, browsing, seat selection, booking, and ticket confirmation                                                                                                                                                                                                                                                               |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                   |
| Stimulus source  | End user                                                                                                                                                                                                                                                                                                                                                                              |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                   |
| Environment      | Production system with multiple services and concurrent users                                                                                                                                                                                                                                                                                                                         |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                   |
| Artifact         | API Gateway, Identity Service, Booking Service, Seat Service, Notification Service, tracing/logging system                                                                                                                                                                                                                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                   |
| Response         | The system assigns a unique correlation ID at the start of the journey and propagates it across all services. Each step emits structured events including action type, service name, timestamp, latency, and outcome. The system must allow reconstruction of the full journey, including both successful and failed paths, showing exactly where delays, errors, or drop-offs occur. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                   |
| Response measure | \- 100% of user journeys have a correlation ID- ≥ 95% of service interactions appear in trace- Full journey reconstruction ≤ 2 seconds- Failure root cause identifiable ≤ 1 minute                                                                                                                                                                                                    |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                   |

### Financial Transaction Observability

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A user initiates a payment, receives a callback, or triggers a refund/exchange                                                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Stimulus source  | User or external payment gateway                                                                                                                                                                                                                                                                                                                                              |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Environment      | Distributed system with external dependency and asynchronous processing                                                                                                                                                                                                                                                                                                       |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Artifact         | Payment Service, Gateway Adapter, Webhook Handler, Refund Workflow                                                                                                                                                                                                                                                                                                            |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Response         | The system logs and traces the full lifecycle of each financial transaction, including request to provider, callback validation, status normalization, retry handling, and compensation (refund/exchange). Each transaction is tracked with a unique transaction ID and correlation ID. The system must distinguish between internal errors, timeouts, and provider failures. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |
| Response measure | \- 100% of transactions traceable end-to-end- Callback linkage accuracy ≥ 99%- Payment timeout ≤ 30s- Failure cause identifiable ≤ 1 minute- Duplicate transaction rate ≤ 0.1%                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                           |

### System & Integration Observability

| **Element**      | **Statement**                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | System experiences degraded performance, external API failure, or admin configuration change                                                                                                                                                                                                                                                                                                    |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                             |
| Stimulus source  | Monitoring system, external provider, or admin                                                                                                                                                                                                                                                                                                                                                  |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                             |
| Environment      | Production system under load or partial failure conditions                                                                                                                                                                                                                                                                                                                                      |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                             |
| Artifact         | Monitoring system, API Gateway, Integration Layer, Admin Service                                                                                                                                                                                                                                                                                                                                |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                             |
| Response         | The system continuously collects metrics, logs, and traces across all services and external integrations. It detects anomalies such as high latency, error spikes, or provider failures. Alerts are triggered when thresholds are exceeded. Observability data must allow correlation between system issues and root causes such as external dependency failure or recent configuration change. |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                             |
| Response measure | \- Metrics collection interval ≤ 5s- Anomaly detection ≤ 5s- Alert generation ≤ 10s- Root cause identification ≤ 1-5 minutes- External failure classification accuracy ≥ 95%                                                                                                                                                                                                                    |
| ---              | ---                                                                                                                                                                                                                                                                                                                                                                                             |

### Scalability

### Concurrent User Handling

| **Element**      | **Statement**                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A large number of users access the system simultaneously                                                                                      |
| ---              | ---                                                                                                                                           |
| Stimulus source  | Concurrent users                                                                                                                              |
| ---              | ---                                                                                                                                           |
| Environment      | Peak load conditions                                                                                                                          |
| ---              | ---                                                                                                                                           |
| Artifact         | Backend services and API layer                                                                                                                |
| ---              | ---                                                                                                                                           |
| Response         | The system distributes incoming requests across multiple instances, utilizes load balancing, and prevents bottlenecks by scaling horizontally |
| ---              | ---                                                                                                                                           |
| Response measure | Supports ≥ 10,000 concurrent users with response time ≤ 2 seconds and error rate < 1%                                                         |
| ---              | ---                                                                                                                                           |

### Background Job Scaling

| **Element**      | **Statement**                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A large number of background jobs (e.g., reminders, notifications) are generated                                                                  |
| ---              | ---                                                                                                                                               |
| Stimulus source  | System scheduler or user actions                                                                                                                  |
| ---              | ---                                                                                                                                               |
| Environment      | Background processing                                                                                                                             |
| ---              | ---                                                                                                                                               |
| Artifact         | Queue system (e.g., worker processes)                                                                                                             |
| ---              | ---                                                                                                                                               |
| Response         | The system distributes jobs across multiple workers, processes them asynchronously, and dynamically increases worker capacity when load increases |
| ---              | ---                                                                                                                                               |
| Response measure | ≥ 95% of jobs processed within defined SLA, queue delay ≤ 5 seconds                                                                               |
| ---              | ---                                                                                                                                               |

### Data Growth Handling

| **Element**      | **Statement**                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | The volume of stored data increases significantly over time                                                                       |
| ---              | ---                                                                                                                               |
| Stimulus source  | Continuous system usage                                                                                                           |
| ---              | ---                                                                                                                               |
| Environment      | Production environment                                                                                                            |
| ---              | ---                                                                                                                               |
| Artifact         | Database system                                                                                                                   |
| ---              | ---                                                                                                                               |
| Response         | The system uses indexing, query optimization, and possibly partitioning to ensure queries remain efficient despite large datasets |
| ---              | ---                                                                                                                               |
| Response measure | Query response time ≤ 200 ms for standard operations                                                                              |
| ---              | ---                                                                                                                               |

### Configurability

### Environment Configuration

| **Element**      | **Statement**                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Stimulus         | A developer changes environment variables such as database connection string or API keys                                                   |
| ---              | ---                                                                                                                                        |
| Stimulus source  | Developer                                                                                                                                  |
| ---              | ---                                                                                                                                        |
| Environment      | Deployment or startup                                                                                                                      |
| ---              | ---                                                                                                                                        |
| Artifact         | Configuration management system                                                                                                            |
| ---              | ---                                                                                                                                        |
| Response         | The system reads configuration from environment variables or configuration files and applies them without requiring changes in source code |
| ---              | ---                                                                                                                                        |
| Response measure | Configuration successfully applied without code modification or rebuild                                                                    |
| ---              | ---                                                                                                                                        |

##

### Maintainability

### Adding New Features

| **Element**      | **Statement**                                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A developer implements a new feature                                                                                                                             |
| ---              | ---                                                                                                                                                              |
| Stimulus source  | Developer                                                                                                                                                        |
| ---              | ---                                                                                                                                                              |
| Environment      | Development                                                                                                                                                      |
| ---              | ---                                                                                                                                                              |
| Artifact         | Codebase                                                                                                                                                         |
| ---              | ---                                                                                                                                                              |
| Response         | The system's modular architecture allows developers to add new features by extending existing modules or adding new ones with minimal impact on other components |
| ---              | ---                                                                                                                                                              |
| Response measure | New feature implemented within 2 days, no regression in existing features                                                                                        |
| ---              | ---                                                                                                                                                              |

### Bug Fixing

| **Element**      | **Statement**                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A defect is identified in the system                                                                                 |
| ---              | ---                                                                                                                  |
| Stimulus source  | QA or end user                                                                                                       |
| ---              | ---                                                                                                                  |
| Environment      | Production                                                                                                           |
| ---              | ---                                                                                                                  |
| Artifact         | Affected module or service                                                                                           |
| ---              | ---                                                                                                                  |
| Response         | Developers can quickly isolate the issue due to clear module boundaries and logging, apply fixes, and deploy patches |
| ---              | ---                                                                                                                  |
| Response measure | Bug fixed and deployed within 4 hours                                                                                |
| ---              | ---                                                                                                                  |

### Code Refactoring

| **Element**      | **Statement**                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Stimulus         | Code requires restructuring to improve quality or performance                                                     |
| ---              | ---                                                                                                               |
| Stimulus source  | Developer                                                                                                         |
| ---              | ---                                                                                                               |
| Environment      | Development                                                                                                       |
| ---              | ---                                                                                                               |
| Artifact         | Code module                                                                                                       |
| ---              | ---                                                                                                               |
| Response         | The system supports safe refactoring due to modular design and test coverage, ensuring behavior remains unchanged |
| ---              | ---                                                                                                               |
| Response measure | All automated tests pass, no functional regression                                                                |
| ---              | ---                                                                                                               |

### Testability

| Element          | Statement                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Stimulus         | A developer writes tests for a component                                                                                     |
| ---              | ---                                                                                                                          |
| Stimulus source  | Developer                                                                                                                    |
| ---              | ---                                                                                                                          |
| Environment      | Development                                                                                                                  |
| ---              | ---                                                                                                                          |
| Artifact         | Service/module                                                                                                               |
| ---              | ---                                                                                                                          |
| Response         | The system supports dependency injection and isolation, allowing components to be tested independently using mocks and stubs |
| ---              | ---                                                                                                                          |
| Response measure | Test coverage ≥ 80%, tests execute within CI pipeline successfully                                                           |
| ---              | ---                                                                                                                          |

# **Architectural Representation**

MovieHub is designed as a microservices-based system with an API Gateway, domain services, Redis, and service-owned databases.

### Logical View

This view presents the system's decomposition into core services.

Subsystems:

- API Gateway: Entry point for all client requests, handles routing, authentication, and rate limiting.
- User Service: Manages user profiles, roles, permissions, and settings.
- Movie Service: Manages movies, genres, releases, and reviews.
- Cinema Service: Handles cinemas, halls, seats, showtimes, and pricing.
- Booking Service: Manages bookings, payments, tickets, and promotions.
- Redis: Supports caching, pub/sub messaging, and seat hold management.
- Clerk: External authentication provider.
- Payment Service: External payment gateway ( .ex VNpay ).

### Implementation View

This view outlines the organization of code and deployment artifacts.

Structure:

- Each subsystem is implemented as an independent microservice (NestJs).
- Services are organized in an Nx monorepo with separate modules.
- Each service follows a layered architecture: controller → service → repository.
- Databases are not shared across services.
- CI/CD pipelines are implemented using GitHub Actions, supporting independent build and deployment for each microservice.

Technologies:

- Backend: NestJS, TypeScript, Prisma
- Frontend: Next.js
- Database: PostgreSQL (per service)
- Cache & Messaging: Redis
- External Services: Clerk (Auth), VNPay (Payment)
- Containerization: Docker

### Deployment View

This view describes the runtime environment and infrastructure.

Environment:

- Deployed on cloud infrastructure (e.g., AWS, GCP)
- Services are containerized using Docker
- Orchestrated via Kubernetes or Docker Compose
- Load Balancer distributes incoming traffic
- Database Nodes: PostgreSQL primary + replicas
- Redis Cluster: For caching and Pub/Sub

Deployment Example:

- Region: Southeast Asia (low latency for target users)
- Platform: Azure Container Apps
- Containerization: Docker
- Orchestration: Managed by Azure Container Apps
- Load Balancing: Azure-managed ingress
- Monitoring: Azure Monitor / Application Insights

### Data View

Focuses on data models and storage strategy.

Primary Storage:

- PostgreSQL: Relational storage for transactional data (users, movies, bookings)
- Redis: Short-lived data (e.g., seat holds, caching, pub/sub)

Data Organization:

- Database-per-service pattern (each service owns its data)
- Data is shared across services via APIs using identifiers

Security Measures:

- Sensitive data encrypted at rest
- HTTPS enforced for all communications
- Access control applied per service and database
