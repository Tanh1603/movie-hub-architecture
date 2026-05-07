# C4 Level 3 - Component Diagram (Booking Service)

```mermaid
C4Component
  title Component diagram for Booking Service
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

  Container(apigw, "API Gateway", "NestJS", "Incoming booking requests")
  ContainerDb(bookingDb, "Booking DB", "PostgreSQL", "Booking and ticket data")
  System_Ext(paymentGateway, "Payment Gateway", "External payment provider")
  System_Ext(notificationProvider, "Notification Provider", "External notification provider")

  Container_Boundary(bookingService, "Booking Service") {
    Component(bookingApi, "Booking API", "Application layer", "Handles booking requests")
    Component(bookingCore, "Booking Core", "Domain logic", "Manages booking lifecycle")
    Component(paymentIntegration, "Payment Integration", "Integration layer", "Handles payment requests and callbacks")
    Component(asyncProcessing, "Async Processing", "Background processing", "Handles deferred notifications")
  }

  Rel(apigw, bookingApi, "Calls")
  Rel(bookingApi, bookingCore, "Calls")
  Rel(bookingCore, bookingDb, "Writes", "SQL")
  Rel(bookingCore, paymentIntegration, "Calls")
  Rel(paymentIntegration, paymentGateway, "Calls", "HTTPS")
  Rel(paymentIntegration, bookingDb, "Writes", "SQL")
  Rel(bookingCore, asyncProcessing, "Sends")
  Rel(asyncProcessing, notificationProvider, "Sends", "HTTPS")
```

- Concern: internal structure of the Booking Service.
- Why it is separated: this view explains how booking responsibilities are split inside one container.
- Quality attributes: modifiability, reliability, and performance.
