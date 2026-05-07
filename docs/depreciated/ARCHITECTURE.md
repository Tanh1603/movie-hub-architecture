# System Architecture

## System Context Diagram (Level 1)

This diagram shows the high-level context of the MovieHub system and its interactions with external users and systems.

```plantuml
@startuml
!theme plain
title System Context Diagram - MovieHub

!include <C4/C4_Context>

Person(user, "User", "A customer looking to book movie tickets.")
Person(admin, "Admin / Staff", "Staff members managing cinemas, movies, and schedule.")

System(moviehub, "MovieHub System", "Allows users to browse movies, book tickets, and manage loyalty points.")

System_Ext(clerk, "Clerk Auth", "Handles user authentication and identity management.")
System_Ext(payment_gw, "Payment Gateways", "VNPAY, Momo, etc. for processing payments.")
System_Ext(email_service, "Email Service", "Sends notifications and tickets.")

Rel(user, moviehub, "Uses", "HTTPS")
Rel(admin, moviehub, "Administers", "HTTPS")

Rel(moviehub, clerk, "Authenticates users", "HTTPS/API")
Rel(moviehub, payment_gw, "Process payments", "HTTPS/API")
Rel(moviehub, email_service, "Sends emails", "SMTP/API")
@enduml
```

## Container Diagram (Level 2)

This diagram shows the diverse microservices and containers that make up the MovieHub system.

```plantuml
@startuml
!theme plain
title Container Diagram - MovieHub

!include <C4/C4_Container>

Person(user, "User", "Customer")
Person(admin, "Admin", "Staff")

System_Ext(clerk, "Clerk Auth", "Identity Provider")
System_Ext(payment_gw, "Payment Gateways", "VNPAY, Momo")

Boundary(c1, "MovieHub System") {
    Container(webapp, "Web Application", "Next.js (React)", "Provides the frontend interface for users and admins.")

    Container(api_gateway, "API Gateway", "NestJS", "Entry point for all client requests. Routes to microservices.")

    ContainerDb(redis, "Redis", "Redis", "Caching and temporary data storage.")

    Boundary(services, "Microservices Layer") {
        Container(user_service, "User Service", "NestJS", "Manages user profiles, roles, and staff.")
        Container(movie_service, "Movie Service", "NestJS", "Manages movie metadata, genres, and reviews.")
        Container(cinema_service, "Cinema Service", "NestJS", "Manages cinemas, halls, seats, and showtimes.")
        Container(booking_service, "Booking Service", "NestJS", "Manages bookings, tickets, prices, and payments.")
    }

    ContainerDb(db_user, "User DB", "PostgreSQL", "Stores user data.")
    ContainerDb(db_movie, "Movie DB", "PostgreSQL", "Stores movie data.")
    ContainerDb(db_cinema, "Cinema DB", "PostgreSQL", "Stores cinema/showtime data.")
    ContainerDb(db_booking, "Booking DB", "PostgreSQL", "Stores orders and transactions.")
}

Rel(user, webapp, "Visits", "HTTPS")
Rel(admin, webapp, "Visits", "HTTPS")

Rel(webapp, clerk, "Auth SDK", "HTTPS")
Rel(webapp, api_gateway, "API Calls", "JSON/HTTPS")

Rel(api_gateway, user_service, "RPC", "TCP")
Rel(api_gateway, movie_service, "RPC", "TCP")
Rel(api_gateway, cinema_service, "RPC", "TCP")
Rel(api_gateway, booking_service, "RPC", "TCP")

Rel(user_service, db_user, "Reads/Writes", "SQL")
Rel(movie_service, db_movie, "Reads/Writes", "SQL")
Rel(cinema_service, db_cinema, "Reads/Writes", "SQL")
Rel(booking_service, db_booking, "Reads/Writes", "SQL")

Rel(api_gateway, redis, "Cache", "TCP")
Rel(booking_service, payment_gw, "Initiates Payment", "HTTPS")

@enduml
```
