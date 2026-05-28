# Sequence Diagram - Async Outbox Processing

```mermaid
sequenceDiagram
    participant Booking as Booking Service (NestJS)
    participant DB as Booking DB (PostgreSQL)
    participant Worker as Async Worker
    participant Notification as Notification Provider (External)

    Booking->>DB: INSERT INTO outbox_events (event_type, payload) SQL
    Worker->>DB: SELECT * FROM outbox_events WHERE processed=false ORDER BY created_at LIMIT 10
    DB-->>Worker: Pending events
    loop For each event
        Worker->>Worker: Process event (e.g., send email/SMS)
        Worker->>Notification: Send notification (HTTPS)
        Notification-->>Worker: Success/Failure
        Worker->>DB: UPDATE outbox_events SET processed=true, processed_at=now WHERE id=event_id
    end
```

This sequence diagram depicts the asynchronous outbox pattern for reliable event processing, ensuring eventual delivery of side effects like notifications while maintaining transactional consistency.
