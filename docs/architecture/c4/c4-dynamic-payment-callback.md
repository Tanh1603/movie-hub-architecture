# C4 Runtime Diagram - Payment Callback Flow

```mermaid
C4Dynamic
  title Runtime diagram for payment callback flow (MovieHub)

  System_Ext(paymentGateway, "Payment Gateway", "External provider")
  Container(bookingSvc, "Booking Service", "NestJS", "Callback handling")
  ContainerDb(bookingDb, "Booking DB", "PostgreSQL", "Booking and ticket data")

  RelIndex(1, paymentGateway, bookingSvc, "Sends", "HTTPS")
  RelIndex(2, bookingSvc, bookingDb, "Reads", "SQL")
  RelIndex(3, bookingSvc, bookingDb, "Writes", "SQL")
  RelIndex(4, bookingSvc, bookingDb, "Writes ticket", "SQL")
```

- Concern: payment callback completion.
- Why it is separated: callback behavior is asynchronous and must be understood apart from the booking request path.
- Quality attributes: reliability and modifiability.
