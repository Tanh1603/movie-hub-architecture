## 8. Security

The security concerns below use the same stimulus/response structure as `docs/architecture/add.md`, while implementation ownership is mapped to [docs/architecture/TEAM_TASK_DIVISION.md](docs/architecture/TEAM_TASK_DIVISION.md).

### 8.1 Authentication

| Element | Statement |
| :- | :- |
| Stimulus | A user attempts to register, log in, or reset password using credentials and OTP verification |
| Stimulus source | End user (web/mobile client) |
| Environment | Public internet, production system, exposed to brute-force or credential-stuffing attempts |
| Artifact | Authentication layer, API Gateway, backend auth middleware |
| Response | Delegate identity verification to Clerk or an equivalent provider. Validate JWT/session tokens at the API Gateway and service boundaries for signature, issuer, audience, and expiry. Enforce OTP for high-risk actions and temporary lockout after repeated failures. Do not leak whether an account exists. |
| Response measure | 100% of protected requests require a valid token; validation latency ≤ 50 ms; failed logins limited to 5 before lockout; lockout duration ≥ 5 minutes; 0% exposure of sensitive identity information in errors |

### 8.2 Authorization

| Element | Statement |
| :- | :- |
| Stimulus | A user attempts to access or modify a protected resource |
| Stimulus source | Authenticated user or internal admin |
| Environment | Production system with multiple roles and ownership rules |
| Artifact | Backend services, RBAC module, API endpoints |
| Response | Enforce RBAC server-side and verify ownership before reads or mutations. Use generic errors for unauthorized access and return 404 where ownership checks should not reveal resource existence. | 
| Response measure | 100% of protected endpoints enforce authorization; unauthorized access rejected in ≤ 100 ms; 0% data exposure outside ownership; 100% admin actions require elevated validation |

### 8.3 Secure Payment Processing & External Integration Protection

| Element | Statement |
| :- | :- |
| Stimulus | A user initiates payment through VNPay, MoMo, Stripe, or another external gateway |
| Stimulus source | Authenticated user during checkout |
| Environment | Distributed system interacting with third-party services over public networks |
| Artifact | Payment service, payment adapter layer, API Gateway |
| Response | Send all payment requests through a secure adapter layer, use HTTPS and signed requests, validate callbacks/webhooks, enforce idempotency keys, and keep sensitive card data out of internal storage. | 
| Response measure | 100% of external payment communication uses HTTPS; 100% of payment callbacks are validated; idempotency enforced for 100% of payment requests; payment timeout ≤ 30 seconds; 0% storage of sensitive card data internally |

### 8.4 Infrastructure Protection

| Element | Statement |
| :- | :- |
| Stimulus | Access attempts against databases, consoles, or server administration paths |
| Stimulus source | Operators, automated tools, or attackers |
| Environment | Management plane, observability tooling, and database networks |
| Artifact | Databases, Grafana/Kibana, SSH access, backup storage |
| Response | Use IP whitelisting, SSH key-only access, restricted ports, Cloudflare for edge protection, encrypted backups, and command auditing. |
| Response measure | 100% of admin consoles restricted; SSH password logins disabled; backups encrypted; administrative commands logged |

---

## 9. Performance and Scalability

### 9.1 Read-Heavy Workload Handling

| Element | Statement |
| :- | :- |
| Stimulus | Open catalog, apply filters, search nearby items, or load active schedules during normal browsing |
| Stimulus source | Guest or member via web client/API entry point |
| Environment | About 100 requests/second normal traffic, read-heavy paths, pagination required |
| Artifact | Read models, query endpoints, cache-backed discovery data |
| Response | Serve repeated reads from cached or precomputed data, keep page sizes bounded, and avoid pushing browsing through the write path. |
| Response measure | First page response time ≤ 3 seconds for 95% of requests; filtered/search/list responses ≤ 2 seconds for 95%; cache hits ≤ 1 second; default page size 10, maximum 50 |

### 9.2 High-Concurrency State Update

| Element | Statement |
| :- | :- |
| Stimulus | Select or deselect a seat while multiple users act on the same showtime |
| Stimulus source | Authenticated users |
| Environment | Around 300 concurrent seat actions on the same showtime |
| Artifact | Real-time seat-selection path, seat state store, broadcast channel |
| Response | Update seat status immediately for the caller, synchronize state to other clients quickly, and reject stale or conflicting actions without waiting for background work. |
| Response measure | Seat-state load ≤ 2 seconds for 95% of requests; UI feedback ≤ 500 ms; server synchronization ≤ 1 second |

### 9.3 Critical Commit Path

| Element | Statement |
| :- | :- |
| Stimulus | Confirm a booking from held seats and initiate payment for a pending booking |
| Stimulus source | Authenticated users |
| Environment | Active booking window, held seats in place, external payment gateway required |
| Artifact | Booking service, seat-reservation state, payment initiation path |
| Response | Validate held seats, commit the booking once, create a pending payment record, and return the payment redirect path without creating duplicates on retries. |
| Response measure | Commit path ≤ 3 seconds for 95% of requests and ≤ 5 seconds for 99%; booking remains valid within the 15-minute hold window; retries do not create duplicate pending state |

---

## 10. Availability, Reliability, Observability, and Maintainability

### 10.1 Availability and Failover

| Element | Statement |
| :- | :- |
| Stimulus | Health checks fail or a service instance becomes unhealthy |
| Stimulus source | Load balancer, readiness/liveness probes |
| Environment | Production system with at least two active instances per core service |
| Artifact | API Gateway, Booking Service, shared infra, health probes |
| Response | Detect failures quickly, remove unhealthy instances from routing, and keep core access alive through remaining replicas. |
| Response measure | Uptime ≥ 99.9% monthly; health-check interval ≤ 10s; timeout ≤ 2s; unhealthy instances removed within 30s; user-visible interruption ≤ 5s |

### 10.2 Reliability and Retry Safety

| Element | Statement |
| :- | :- |
| Stimulus | External provider timeout, duplicate callback, or a retry on a booking/payment flow |
| Stimulus source | External payment provider, notification provider, internal retry logic |
| Environment | Distributed system with external dependencies and asynchronous processing |
| Artifact | Payment adapter, webhook handler, outbox processing, booking state machine |
| Response | Retry only transient failures with bounded backoff, deduplicate callbacks, preserve idempotency, and keep booking state authoritative. |
| Response measure | Max 3 retries with 1s/2s/4s backoff; total retry time ≤ 10s; exactly one booking confirmation per successful payment; no committed transaction loss during failover |

### 10.3 Logging and Monitoring

| Element | Statement |
| :- | :- |
| Stimulus | A critical booking, payment, or callback flow completes or fails |
| Stimulus source | API Gateway, service handlers, async workers |
| Environment | Normal operation and incident investigation |
| Artifact | Structured logs, correlation IDs, traces, metrics stack |
| Response | Propagate correlation IDs end-to-end, write structured logs, export metrics, and trace cross-service calls so incidents can be diagnosed quickly. |
| Response measure | 100% of critical flows include correlation IDs; metrics scraped regularly; logs searchable through ELK; alerting enabled for latency/error thresholds |

### 10.4 Backup and Restoration

| Element | Statement |
| :- | :- |
| Stimulus | Database corruption, accidental deletion, or regional failure |
| Stimulus source | Infrastructure failure or recovery request |
| Environment | Service-owned PostgreSQL data and backup storage |
| Artifact | Backup jobs, restore procedures, validation scripts |
| Response | Use PITR or snapshot-based recovery, validate restored data before reopening traffic, and replay only safe outbox events after restore. |
| Response measure | Continuous WAL archiving with periodic restore tests; restore validation passes before production re-enable; recovery procedures documented and rehearsed |

### 10.5 Maintainability

| Element | Statement |
| :- | :- |
| Stimulus | Business rules, deployment configuration, or integration contracts change |
| Stimulus source | Product, operations, or technical debt remediation |
| Environment | Active development and deployment lifecycle |
| Artifact | Microservice boundaries, adapter layers, CI/CD, runbooks |
| Response | Keep services isolated, move provider-specific logic behind adapters, and keep configuration and recovery procedures documented so change impact stays localized. |
| Response measure | Smallest possible service blast radius for a typical change; documented runbooks for recovery; implementation tasks aligned to team ownership in [docs/architecture/TEAM_TASK_DIVISION.md](docs/architecture/TEAM_TASK_DIVISION.md) |

