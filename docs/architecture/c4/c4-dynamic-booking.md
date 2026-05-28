# C4 Runtime Diagram - Booking Flow

```mermaid
C4Dynamic
  title Runtime diagram for booking flow (MovieHub)

  Container(web, "Web App", "Next.js", "Booking UI")
  Container(apigw, "API Gateway", "NestJS", "API entry")
  Container(bookingSvc, "Booking Service", "NestJS", "Booking execution")
  ContainerDb(cache, "Cache", "Redis", "Seat state")
  ContainerDb(bookingDb, "Booking DB", "PostgreSQL", "Booking data")
  System_Ext(paymentGateway, "Payment Gateway", "External provider")

  RelIndex(1, web, apigw, "Calls", "HTTPS")
  RelIndex(2, apigw, bookingSvc, "Calls")
  RelIndex(3, bookingSvc, cache, "Writes")
  RelIndex(4, bookingSvc, bookingDb, "Writes", "SQL")
  RelIndex(5, bookingSvc, paymentGateway, "Calls", "HTTPS")
  RelIndex(6, apigw, web, "Returns", "HTTPS")
```

- Concern: synchronous booking path.
- Why it is separated: this is the user-critical path and must stay short and readable.
- Quality attributes: performance and reliability.
