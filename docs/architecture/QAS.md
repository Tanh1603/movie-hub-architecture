# Quality Attribute Scenarios

## Performance

### P-01: Read-Heavy Workload Handling
- Source: Guest or Member
- Stimulus: Open the catalog, apply filters, search nearby cinemas, or load active showtimes during normal browsing load.
- Artifact: Read models, query endpoints, and cache-backed discovery data.
- Environment: 100 requests/second normal traffic, with read-heavy traffic and standard pagination.
- Response: The system serves repeated reads from cached or precomputed data when available, keeps page size bounded, and returns the first result page without waiting on slower write-side operations. When read pressure increases, it continues serving from replicated or cached read data rather than forcing each request through the write path.
- Response Measure: First page response time is <= 3 seconds for 95% of requests and <= 4 seconds for 99% of requests; filtered/search/showtime list responses are <= 2 seconds for 95% of requests; cache hits are <= 1 second; default page size is 10 and maximum page size is 50.

### P-02: High-Concurrency State Update
- Source: Member
- Stimulus: Select or deselect a seat while multiple users are interacting with the same showtime.
- Artifact: Real-time seat selection path, seat state store, and broadcast channel.
- Environment: About 300 concurrent seat actions on the same showtime.
- Response: The system updates seat status immediately for the caller, synchronizes the seat state to other clients quickly, and rejects stale or conflicting actions without waiting for slower background work. When contention increases, it keeps the caller responsive by committing only the minimal state change needed and broadcasting the new state to the rest of the clients.
- Response Measure: Seat state load is <= 2 seconds for 95% of requests and <= 3 seconds for 99% of requests; UI feedback is <= 500 ms; server synchronization completes within <= 1 second.

### P-03: Critical Commit Path
- Source: Member
- Stimulus: Confirm a booking from held seats and initiate payment for a pending booking.
- Artifact: Booking service, cinema seat reservation state, payment initiation path.
- Environment: Active booking window, held seats in place, external payment gateway required.
- Response: The system validates the held seats, commits the booking record once, creates a pending payment record, and returns the payment redirect path without letting the booking expire or duplicate. If a request is retried, the system reuses the existing pending state rather than creating a second checkout path.
- Response Measure: The commit path completes within <= 3 seconds for 95% of requests and <= 5 seconds for 99% of requests; the booking remains valid within the 15-minute hold window; repeated requests do not create duplicate pending state.

## Availability

### A-01: Core Access Continuity
- Source: Guest, Member, Admin, or Cinema Manager
- Stimulus: Submit login or token-validation requests while one or more core instances are unhealthy.
- Artifact: Authentication path at the API boundary and identity service.
- Environment: Monthly core-service uptime target, health-check driven routing, and at least two service instances behind the load balancer.
- Response: The system routes around unhealthy instances, keeps authentication reachable, and fails fast when an instance does not respond instead of stalling the entire login flow. If a node becomes unhealthy, traffic shifts away and requests continue on the remaining healthy instance without requiring a full service stop.
- Response Measure: Core services maintain uptime >= 99.9% monthly; unhealthy instances are detected within 10 seconds and removed within 30 seconds; request interruption during failover is <= 5 seconds; failover should keep the user-visible interruption p95 under 3 seconds.

### A-02: External Dependency Failure Handling
- Source: Member
- Stimulus: Start payment for a booking while the external payment gateway times out or returns an error.
- Artifact: Payment initiation path and external gateway integration.
- Environment: External dependency failure, retry window, and booking still inside the payment eligibility period.
- Response: The system retries the external call a limited number of times, keeps the checkout flow alive, and returns a clear status if the gateway remains unavailable. If the gateway stays down, the booking remains in a recoverable state instead of failing the entire flow.
- Response Measure: Retry occurs up to 3 times with backoff of 1s, 2s, and 4s; total retry time does not exceed 10 seconds; user-visible response remains within 3 seconds for 95% of requests and 5 seconds for 99% of requests; the booking remains recoverable after a downstream timeout.

### A-03: Operational Continuity Under Failover
- Source: VNPay gateway or Staff
- Stimulus: Receive a payment callback or validate a ticket while an application instance or database replica is unhealthy.
- Artifact: Payment callback path, booking update path, and ticket validation path.
- Environment: Peak traffic, public callback traffic, and failover conditions.
- Response: The system continues accepting valid callbacks and validation requests, avoids losing committed state, and shifts traffic away from failed instances without breaking the workflow. The callback path remains idempotent so a retried notification does not replay business effects.
- Response Measure: Health checks run every 10 seconds with <= 2 seconds timeout; unhealthy nodes are removed within 30 seconds; committed transactions are not lost; gate validation remains available during peak entry periods; callback replay does not duplicate business effects.

## Reliability

### R-01: Concurrent Shared-Resource Consistency
- Source: Member
- Stimulus: Two or more users attempt to hold the same seat at nearly the same time.
- Artifact: Real-time seat hold state and per-seat reservation records.
- Environment: At least 2 concurrent requests for the same seat within the active showtime window.
- Response: The system allows only one seat hold to succeed, rejects the conflicting request immediately, and expires the seat hold automatically if payment is not completed in time.
- Response Measure: At most 1 booking succeeds for the seat; hold TTL is <= 5 minutes; release occurs within <= 1 minute after expiry or payment failure; conflicting requests are rejected deterministically under concurrency.

### R-02: Distributed Commit Consistency
- Source: Member and VNPay gateway
- Stimulus: Complete payment successfully, retry a payment request, or receive a duplicate callback.
- Artifact: Booking record, payment record, and generated ticket set.
- Environment: Retry conditions, callback duplication, and timeout handling after payment submission.
- Response: The system records the payment result once, confirms exactly one booking, generates the corresponding tickets once, and does not publish tickets when the payment does not complete successfully.
- Response Measure: Exactly one confirmed booking and one ticket set are produced for a successful payment; retries do not duplicate effects; failed or timed-out payment returns the seat within <= 1 minute; partial failures do not leave booking, payment, and issued state inconsistent.

### R-03: External Reconciliation Idempotency
- Source: VNPay gateway
- Stimulus: Deliver the same callback more than once or deliver a callback after the initial result has already been processed.
- Artifact: Callback handling path, payment state, and booking state.
- Environment: Public callback traffic, duplicate delivery, and late-arriving notifications.
- Response: The system verifies the callback once, ignores duplicate delivery safely, and leaves the already-processed result unchanged while still returning a valid acknowledgment.
- Response Measure: Duplicate callbacks do not change state; callback processing completes within the same 3-second response window; no orphaned or duplicate payment transitions are created.

### R-04: Cancellation and Compensation Integrity
- Source: Member
- Stimulus: Cancel a booking with refund requested near or before the refund cutoff time.
- Artifact: Booking state and refund request record.
- Environment: Booking is eligible or ineligible based on time and status, with possible retry on submission.
- Response: The system cancels only eligible bookings, creates exactly one refund request when allowed, and prevents repeated requests from creating duplicate refund records.
- Response Measure: Cancellation is allowed only for PENDING or CONFIRMED bookings; cancellation for refund must be at least 2 hours before showtime; refund amount is 70% of the ticket price; refund record starts as PENDING.

### R-05: Single-Use Entry Integrity
- Source: Staff
- Stimulus: Scan a ticket at the cinema entrance, including repeated scans of the same ticket.
- Artifact: Ticket status record and audit timestamp.
- Environment: Live gate entry flow with possible double-scan attempts and clock drift around showtime end.
- Response: The system accepts the ticket only if it is still valid, transitions it to used atomically, and rejects any later attempt to reuse the same ticket.
- Response Measure: A ticket transitions only from VALID to USED; validation fails after showtime end; the usage timestamp is recorded; duplicate scans do not result in multiple entries; the transition is atomic under concurrent scans.
