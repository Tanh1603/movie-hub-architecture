# C4 Level 2 - Container Diagram (MovieHub)

```mermaid
C4Container
  title Container diagram for MovieHub
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

  Person(customer, "Customer", "Uses the booking application")
  Person(manager, "Cinema Manager", "Uses operational features")

  System_Ext(payment, "Payment Gateway", "External payment provider")
  System_Ext(notify, "Notification Provider", "External notification provider")

  System_Boundary(moviehub, "MovieHub") {
    Container(web, "Web App", "Next.js", "User interface")
    Container(apigw, "API Gateway", "NestJS", "Single backend entry")

    Container(userSvc, "User Service", "NestJS", "User and profile logic")
    Container(movieSvc, "Movie Service", "NestJS", "Movie catalog logic")
    Container(cinemaSvc, "Cinema Service", "NestJS", "Cinema and showtime logic")
    Container(bookingSvc, "Booking Service", "NestJS", "Booking and payment logic")
    Container(asyncSvc, "Async Worker", "Worker", "Background processing")

    ContainerDb(userDb, "User DB", "PostgreSQL", "User data")
    ContainerDb(movieDb, "Movie DB", "PostgreSQL", "Movie data")
    ContainerDb(cinemaDb, "Cinema DB", "PostgreSQL", "Cinema data")
    ContainerDb(bookingDb, "Booking DB", "PostgreSQL", "Booking data")
    ContainerDb(cache, "Cache", "Redis", "Shared cache")
  }

  Rel(customer, web, "Uses", "HTTPS")
  Rel(manager, web, "Uses", "HTTPS")
  Rel(web, apigw, "Calls", "HTTPS")

  Rel(apigw, userSvc, "Calls")
  Rel(apigw, movieSvc, "Calls")
  Rel(apigw, cinemaSvc, "Calls")
  Rel(apigw, bookingSvc, "Calls")

  Rel(userSvc, userDb, "Writes", "SQL")
  Rel(movieSvc, movieDb, "Writes", "SQL")
  Rel(cinemaSvc, cinemaDb, "Writes", "SQL")
  Rel(bookingSvc, bookingDb, "Writes", "SQL")

  Rel(movieSvc, cache, "Reads")
  Rel(cinemaSvc, cache, "Reads")
  Rel(bookingSvc, cache, "Reads")

  Rel(bookingSvc, payment, "Calls", "HTTPS")
  Rel(asyncSvc, notify, "Sends", "HTTPS")
  Rel(asyncSvc, bookingDb, "Reads", "SQL")
```

- Concern: major runtime containers and their responsibilities.
- Why it is separated: this view explains service and data boundaries without component or infrastructure detail.
- Quality attributes: modifiability, scalability, and performance.
