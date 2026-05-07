# C4 Runtime Diagram - Async Outbox Processing

```mermaid
C4Dynamic
  title Runtime diagram for async outbox processing (MovieHub)

  Container(bookingSvc, "Booking Service", "NestJS", "Writes events")
  Container(asyncWorker, "Async Worker", "Worker", "Processes queued events")
  ContainerDb(bookingDb, "Booking DB", "PostgreSQL", "Event queue and booking data")
  System_Ext(notificationProvider, "Notification Provider", "External provider")

  RelIndex(1, bookingSvc, bookingDb, "Writes event", "SQL")
  RelIndex(2, asyncWorker, bookingDb, "Reads event", "SQL")
  RelIndex(3, asyncWorker, notificationProvider, "Sends", "HTTPS")
  RelIndex(4, asyncWorker, bookingDb, "Writes status", "SQL")
```

- Concern: deferred event processing.
- Why it is separated: asynchronous delivery should be visible independently from synchronous booking behavior.
- Quality attributes: reliability, availability, and modifiability.
