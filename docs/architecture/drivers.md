# Architectural Drivers

## 1. Performance Drivers
- UC: UC-02 List Movies
  - Reason: High-frequency browsing path that shapes query pagination, caching, and catalog read performance.
  - Constraints: 100 req/s normal load; first page ≤ 3s for 95% of requests; pagination required with default 10 and max 50 items; cache hits should be ≤ 1s.
  - Priority: HIGH

- UC: UC-03 Search Cinemas Nearby
  - Reason: Location-based discovery must stay fast enough for guest/member browsing and geospatial query growth.
  - Constraints: 100 req/s normal load; search/filter APIs ≤ 2s for 95% of requests; nearby results sorted by distance; cache-backed discovery data where applicable.
  - Priority: MEDIUM

- UC: UC-04 Get Movie Showtimes at Cinema
  - Reason: Showtime lookup feeds the booking funnel and needs low-latency reads on frequently changing data.
  - Constraints: Read-heavy traffic with cached showtime data; list APIs ≤ 2s for 95% of requests; cache TTL at least 5 minutes; peak browsing must remain ≤ 3s.
  - Priority: HIGH

- UC: UC-05 Hold Seat
  - Reason: Real-time seat selection must respond quickly to preserve UX and avoid seat contention during concurrent selection.
  - Constraints: ~300 concurrent seat actions; seat state load ≤ 2s; UI seat action ≤ 500ms; server sync ≤ 1s.
  - Priority: HIGH

- UC: UC-06 Create Booking
  - Reason: Booking creation is the latency-sensitive commit point between seat holding and payment initiation.
  - Constraints: Booking flow must complete within the active hold window; list/interactive operations must remain under the published response-time limits; pending booking expiry is 15 minutes.
  - Priority: HIGH

- UC: UC-07 Create Payment
  - Reason: Payment initiation must remain fast because it directly affects checkout completion and conversion.
  - Constraints: Payment must start within the 15-minute booking window; external gateway call must not inflate API latency beyond the 2-3s user-visible budget.
  - Priority: HIGH

## 2. Availability Drivers
- UC: UC-01 User Authentication
  - Reason: Authentication is a gateway dependency for all member and staff flows, so service outage blocks broad platform access.
  - Constraints: Core services must reach 99.9% monthly uptime; login/registration-related paths are part of the always-on surface; health checks every 10s with ≤ 2s timeout.
  - Priority: HIGH

- UC: UC-07 Create Payment
  - Reason: Payment initiation depends on an external gateway and must tolerate provider outages without taking down checkout.
  - Constraints: External dependencies may timeout after >5s; retry up to 3 times with exponential backoff (1s, 2s, 4s); system response must remain within 3s with clear status.
  - Priority: HIGH

- UC: UC-08 VNPay IPN Webhook
  - Reason: Callback processing is asynchronous but operationally critical because it closes the payment loop and advances booking state.
  - Constraints: Public webhook must remain reachable under 99.9% uptime target; failover must detect unhealthy instances within 10s and remove them within 30s; no loss of committed transactions.
  - Priority: HIGH

- UC: UC-11 Process Refund
  - Reason: Refund operations are business-critical back-office flows that must remain available even during partial service degradation.
  - Constraints: Core services run at least 2 instances behind load balancer; failover should not interrupt requests for more than 5s; downstream failures should degrade gracefully.
  - Priority: MEDIUM

- UC: UC-12 Validate Ticket
  - Reason: Ticket validation is a live operational endpoint used at the cinema gate and must remain available during peak entry periods.
  - Constraints: Core service uptime 99.9%; health checks every 10s; failure handling must avoid total service crash and preserve read access to ticket status.
  - Priority: MEDIUM

## 3. Reliability Drivers
- UC: UC-05 Hold Seat
  - Reason: Concurrent seat locking must prevent double booking and maintain seat-state integrity across real-time interactions.
  - Constraints: At least 2 concurrent requests for the same seat; maximum 1 successful booking per seat; hold TTL ≤ 5 minutes; release within ≤ 1 minute after expiry or payment failure.
  - Priority: HIGH

- UC: UC-06 Create Booking
  - Reason: Booking creation must consume held seats exactly once and prevent duplicate pending bookings.
  - Constraints: Idempotency required for retry safety; only one pending booking per user per showtime; booking expiry 15 minutes; seat release after failed payment within ≤ 1 minute.
  - Priority: HIGH

- UC: UC-08 VNPay IPN Webhook
  - Reason: Callback reconciliation is the critical consistency boundary for payment-to-booking state transitions.
  - Constraints: Payment success must create exactly 1 confirmed booking and 1 ticket set; retries/duplicate callbacks must not duplicate effects; timeout handling must preserve consistency.
  - Priority: HIGH

- UC: UC-09 Cancel Booking
  - Reason: Cancellation must reliably transition booking state and release reserved seats so they can be reused safely.
  - Constraints: Only PENDING or CONFIRMED bookings can cancel; seats must become available immediately after cancellation; concurrent cancellation must not corrupt seat reservations.
  - Priority: MEDIUM

- UC: UC-10 Cancel with Refund
  - Reason: Combined cancellation/refund flow crosses booking and finance state, so it needs strong consistency and eligibility checks.
  - Constraints: Cancellation at least 2 hours before showtime for refund eligibility; refund amount rule is 70%; refund record starts as PENDING; no duplicate refund requests on retry.
  - Priority: HIGH

- UC: UC-11 Process Refund
  - Reason: Refund lifecycle transitions must be auditable and deterministic to avoid orphaned or stuck refund states.
  - Constraints: Refund statuses are PENDING, PROCESSING, COMPLETED, FAILED; transitions must be guarded by current status; retry safety and concurrency control are required.
  - Priority: MEDIUM

- UC: UC-12 Validate Ticket
  - Reason: Gate validation must be consistent with ticket and showtime state to prevent invalid admissions.
  - Constraints: Ticket must be VALID; validation fails after showtime end; no use of cancelled/used tickets; result must be deterministic under clock drift.
  - Priority: MEDIUM

- UC: UC-13 Use Ticket
  - Reason: Entry consumption must atomically move a ticket from VALID to USED so it cannot be reused.
  - Constraints: Transition only from VALID to USED; usage timestamp must be recorded; double-scan protection is required.
  - Priority: HIGH
