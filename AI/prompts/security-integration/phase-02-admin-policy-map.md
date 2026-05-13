# Phase 02 High-Risk Admin Policy Map

## Booking Admin

- `PUT /v1/bookings/admin/:id/status`: `CINEMA_MANAGER`
- `POST /v1/bookings/admin/:id/confirm`: `CINEMA_MANAGER`
- `POST /v1/bookings/admin/:id/complete`: `CINEMA_MANAGER`
- `POST /v1/bookings/admin/:id/expire`: `CINEMA_MANAGER`

## Payment Admin

- `PUT /v1/payments/admin/:id/cancel`: `CINEMA_MANAGER`
- `GET /v1/payments/admin/statistics`: `CINEMA_MANAGER`

## Refund Admin

- `PUT /v1/refunds/:id/process`: `CINEMA_MANAGER`
- `PUT /v1/refunds/:id/approve`: `ADMIN`
- `PUT /v1/refunds/:id/reject`: `ADMIN`

## Ticket Admin

- `POST /v1/tickets/admin/bulk-validate`: `CINEMA_MANAGER|ASSISTANT_MANAGER|TICKET_CLERK|CONCESSION_STAFF|USHER|PROJECTIONIST|CLEANER|SECURITY`
- `PUT /v1/tickets/admin/:id/cancel`: `CINEMA_MANAGER`

## Policy Notes

- Every endpoint in this map must have both `@Roles(...)` and `@Permission(...)`.
- Ownership mismatches on scoped resources must return `404` (resource hiding).
