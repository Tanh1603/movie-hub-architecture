# Sequence Diagram - Booking Flow

```mermaid
sequenceDiagram
    participant Member as Member (Web App)
    participant API as API Gateway (NestJS)
    participant Booking as Booking Service (NestJS)
    participant Cinema as Cinema Service (NestJS)
    participant DB_Booking as Booking DB (PostgreSQL)
    participant DB_Cinema as Cinema DB (PostgreSQL)

    Member->>API: POST /v1/bookings (showtimeId, seats, concessions)
    API->>API: Validate Auth (JWT)
    API->>Booking: TCP: booking.create
    Booking->>Cinema: TCP: showtime.getSeatsHeldByUser
    Cinema->>DB_Cinema: Verify held seats
    DB_Cinema-->>Cinema: Held seat details
    Cinema-->>Booking: Seat verification
    Booking->>Cinema: TCP: showtime.getShowtimeDetails
    Cinema->>DB_Cinema: Get pricing & showtime info
    DB_Cinema-->>Cinema: Showtime details
    Cinema-->>Booking: Pricing & details
    Booking->>DB_Booking: INSERT Booking (status=PENDING, expires_at=now+15min)
    Booking->>DB_Booking: INSERT Tickets (for each seat)
    DB_Booking-->>Booking: Booking created
    Booking-->>API: ServiceResult: booking
    API-->>Member: 201 Created (bookingId, booking_code, final_amount)
```

This sequence diagram illustrates the synchronous booking creation flow in MovieHub, focusing on seat verification, pricing calculation, and PENDING booking creation. Payment initiation is a separate subsequent step.
