# C4 Level 1 - System Context (MovieHub)

```mermaid
C4Context
  title System Context diagram for MovieHub

  Person(customer, "Customer", "Browses movies and books tickets")
  Person(manager, "Cinema Manager", "Manages schedules and cinema operations")
  Person(admin, "Platform Admin", "Monitors and operates the platform")

  System(moviehub, "MovieHub", "Online movie booking platform")

  System_Ext(clerk, "Clerk", "Authentication provider")
  System_Ext(payment, "Payment Gateway", "Online payment provider")
  System_Ext(notify, "Notification Provider", "Email/SMS provider")
  System_Ext(obs, "Observability Stack", "Logs, metrics, and traces")

  Rel(customer, moviehub, "Uses", "HTTPS")
  Rel(manager, moviehub, "Uses", "HTTPS")
  Rel(admin, moviehub, "Operates", "HTTPS")

  Rel(moviehub, clerk, "Validates identity", "HTTPS")
  Rel(moviehub, payment, "Processes payments", "HTTPS")
  Rel(moviehub, notify, "Sends notifications", "HTTPS")
  Rel(moviehub, obs, "Sends telemetry", "HTTPS")
```

- Concern: external actors and system boundary.
- Why it is separated: this view clarifies who interacts with MovieHub and which dependencies are outside control.
- Quality attributes: modifiability, reliability, and security.
