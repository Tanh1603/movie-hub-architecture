# C4 Runtime Diagram - Real-time Seat Update Flow

```mermaid
C4Dynamic
  title Runtime diagram for real-time seat update flow (MovieHub)

  Container(web, "Web App", "Next.js", "Seat map UI")
  Container(apigw, "API Gateway", "NestJS", "WebSocket endpoint")
  Container(bookingSvc, "Booking Service", "NestJS", "Seat state source")
  ContainerDb(cache, "Cache", "Redis", "Realtime event channel")

  RelIndex(1, bookingSvc, cache, "Sends")
  RelIndex(2, apigw, cache, "Reads")
  RelIndex(3, apigw, web, "Pushes", "WebSocket")
```

- Concern: realtime seat-state propagation.
- Why it is separated: realtime delivery has different scaling and latency behavior from transactional processing.
- Quality attributes: performance and scalability.
