# Functional Requirements

## 1. System Overview
MovieHub is a multi-service cinema platform for discovery, booking, payment, ticket issuance, refunds, and operational management. It supports guest browsing, member self-service flows, and staff/admin workflows across cinemas, halls, showtimes, promotions, loyalty, and system settings. The most architecture-sensitive paths are real-time seat locking, booking expiry, payment gateway reconciliation, and refund/ticket lifecycle transitions.

## 2. Module Breakdown
- 3.1 User Management: authentication, user profile access, and staff administration.
- 3.2.1 Cinema Management: cinema catalog, CRUD, location-based discovery, and city/district filters.
- 3.2.2 Hall Management: hall lookup and maintenance, including seat status updates.
- 3.2.3 Ticket Pricing Management: hall-level pricing lookup and updates.
- 3.3.1 Movie Catalog: movie browsing, search, and catalog maintenance.
- 3.3.2 Movie Releases: release lifecycle management for movies.
- 3.3.3 Genre Management: genre catalog maintenance.
- 3.3.4 Movie Reviews: review browsing and moderation-style CRUD.
- 3.4 Showtime Scheduling: showtime creation, updates, search, and seat availability views.
- 3.5.1 User Booking Operations: booking creation, lookup, cancellation, rescheduling, and refund-related actions.
- 3.5.2 Admin Booking Operations: operational booking oversight, status changes, analytics, and revenue reporting.
- 3.5.3 Real-time Seat Selection: seat hold/release, session TTL, and concurrent seat access control.
- 3.6 Payment Transaction Module: payment initiation, provider callbacks, payment lookup, and payment administration.
- 3.7 Ticket Management Module: ticket lookup, QR generation, validation, usage, and admin search.
- 3.8 Refund Management Module: refund request lifecycle, processing, approval, and rejection.
- 3.9 Concessions FB Module: concession catalog and inventory control.
- 3.10 Promotions Discounts Module: promotion discovery, validation, and lifecycle management.
- 3.11 Loyalty Points Module: balance, history, earn, and redeem flows.
- 3.12 System Configuration Module: global settings read/update for platform behavior.

## 3. Critical Use Cases

### UC-01: User Authentication
- Description: Authenticates users and establishes secure access for member, staff, and admin flows.
- Main Flow: User submits credentials; gateway validates and returns authenticated session or token.
- Edge Cases: Invalid credentials, expired/disabled account, rate limiting, token refresh failure.

### UC-02: List Movies
- Description: Returns searchable, filterable movie catalog data for guest and member browsing.
- Main Flow: Client requests catalog with filters; movie service queries and paginates results.
- Edge Cases: Empty result set, invalid filters, stale pagination cursors, slow catalog reads.

### UC-03: Search Cinemas Nearby
- Description: Finds active cinemas close to the user’s current location.
- Main Flow: Client sends coordinates; service computes distances and returns sorted nearby cinemas.
- Edge Cases: Missing/invalid coordinates, no cinemas in radius, geospatial query timeout, radius defaults.

### UC-04: Get Movie Showtimes at Cinema
- Description: Exposes available showtimes for a selected cinema and movie view.
- Main Flow: Client selects cinema or movie context; service returns active showtimes for the requested scope.
- Edge Cases: Showtime just expired, no active sessions, pagination/sorting mismatches, stale cache.

### UC-05: Hold Seat
- Description: Temporarily locks a seat so the member can safely continue booking.
- Main Flow: Client emits a real-time hold event; cinema service stores a Redis TTL lock and broadcasts updates.
- Edge Cases: Seat already held, user exceeds max seat count, hold TTL expires mid-flow, concurrent hold race.

### UC-06: Create Booking
- Description: Creates the booking record for held seats and starts the payment window.
- Main Flow: Booking service validates held seats, calculates price, persists a pending booking, and starts expiry.
- Edge Cases: Hold expired, duplicate pending booking, seat reservation conflict, service-to-service timeout.

### UC-07: Create Payment
- Description: Starts payment for a pending booking through the external payment gateway.
- Main Flow: Service verifies booking eligibility, creates a pending payment record, and returns a redirect URL.
- Edge Cases: Booking already expired or paid, duplicate payment attempts, gateway URL generation failure, amount mismatch.

### UC-08: VNPay IPN Webhook
- Description: Reconciles asynchronous payment results from VNPay and advances booking state.
- Main Flow: Gateway forwards webhook data; booking service validates signature, updates payment, and confirms booking on success.
- Edge Cases: Invalid hash, duplicate callback, out-of-order notification, partial failure after payment success.

### UC-09: Cancel Booking
- Description: Cancels a pending or confirmed booking and releases its reserved seats.
- Main Flow: Service checks booking state, marks it cancelled, and releases seat reservations in the cinema service.
- Edge Cases: Booking not owned by user, already completed/expired booking, seat release failure, concurrent cancellation.

### UC-10: Cancel with Refund
- Description: Cancels a booking and opens the refund workflow in one step.
- Main Flow: Service verifies refund eligibility, cancels the booking, and creates a pending refund request.
- Edge Cases: Past refund cutoff, incorrect booking status, duplicate refund request, downstream refund provider outage.

### UC-11: Process Refund
- Description: Moves a refund request into processing for finance or gateway handling.
- Main Flow: Admin requests processing; service checks status and transitions the refund to processing.
- Edge Cases: Non-pending refund status, repeated admin action, concurrency on the same refund, audit trail gaps.

### UC-12: Validate Ticket
- Description: Checks whether a ticket is valid without consuming it.
- Main Flow: Staff scans or enters ticket data; service verifies status and showtime validity.
- Edge Cases: Ticket not found, expired showtime, cancelled/used ticket, clock drift near showtime end.

### UC-13: Use Ticket
- Description: Marks a valid ticket as used when the customer enters the hall.
- Main Flow: Staff submits the ticket; service atomically transitions status from valid to used.
- Edge Cases: Double scan, invalid status, race with validation, missing usage timestamp.

### UC-14: Validate Promotion Code
- Description: Confirms whether a promotion code is usable before checkout.
- Main Flow: Client submits code and context; service checks active rules and returns eligibility.
- Edge Cases: Expired or inactive promotion, usage limit reached, booking-context mismatch, code lookup timeout.

### UC-15: Get Loyalty Balance
- Description: Returns the member’s current loyalty point balance for redemption or status display.
- Main Flow: Client requests balance; loyalty service returns the current points total and related summary.
- Edge Cases: Stale balance after recent earn/redeem event, ledger inconsistency, missing member record.
