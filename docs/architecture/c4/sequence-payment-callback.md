# Sequence Diagram - Payment Callback Flow

```mermaid
sequenceDiagram
    participant VNPay as VNPay Gateway (External)
    participant API as API Gateway (NestJS)
    participant Booking as Booking Service (NestJS)
    participant DB as Booking DB (PostgreSQL)
    participant Cinema as Cinema Service (NestJS)
    participant Ticket as Ticket Service (Internal)
    participant Loyalty as Loyalty Service (Internal)
    participant Redis as Redis (Pub/Sub)

    VNPay->>API: GET /v1/payments/vnpay/ipn (params + signature)
    API->>Booking: TCP: payment.handleVNPayIPN
    Booking->>Booking: Validate HMAC signature
    alt Signature Invalid
        Booking-->>API: {RspCode: "97", Message: "Checksum failed"}
        API-->>VNPay: HTTP 200 (JSON response)
    end
    Booking->>DB: SELECT Payment & Booking
    DB-->>Booking: Records
    alt Payment Success (vnp_ResponseCode == "00")
        Booking->>DB: BEGIN TRANSACTION
        Booking->>DB: UPDATE Payments SET status=COMPLETED, paid_at=now
        Booking->>DB: UPDATE Bookings SET status=CONFIRMED
        opt Loyalty points redeemed
            Booking->>Loyalty: TCP: loyalty.redeem
            Loyalty->>DB: INSERT LoyaltyTransactions (REDEEM)
            Loyalty->>DB: UPDATE LoyaltyAccounts current_points -= used
        end
        Booking->>DB: COMMIT TRANSACTION
        Booking->>Cinema: TCP: cinema.bookSeats (showtimeId, seatIds, bookingId)
        Cinema->>DB: INSERT SeatReservations (status=CONFIRMED)
        Cinema->>Redis: PUBLISH cinema.seat_booked
        Booking->>Ticket: TCP: ticket.generateQR
        Ticket->>DB: UPDATE Tickets SET qr_code, barcode
        Booking->>Redis: PUBLISH booking.confirmed
        Booking-->>API: {RspCode: "00", Message: "Confirm Success"}
    else Payment Failed
        Booking->>DB: UPDATE Payments SET status=FAILED
        Booking-->>API: {RspCode: "00", Message: "Confirm Success"}
    end
    API-->>VNPay: HTTP 200 (JSON response)
```

This sequence diagram illustrates the asynchronous payment callback completion flow, emphasizing reliability, idempotency, and transactional consistency as outlined in the quality attribute requirements and functional specs.
