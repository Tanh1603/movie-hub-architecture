# C4 Level 4 - Deployment Diagram (MovieHub)

```mermaid
C4Deployment
title Deployment Diagram - MovieHub Production Environment

Deployment_Node(client, "Client Device", "Browser / Mobile") {
    Container(web, "Web Application", "Next.js", "Customer-facing frontend")
}

System_Ext(clerk, "Clerk", "Authentication Provider")
System_Ext(payment, "Payment Gateway", "External payment service")
System_Ext(notify, "Notification Provider", "Email/SMS delivery")

Deployment_Node(cloud, "Cloud Region", "Managed Cloud Environment") {

    Deployment_Node(edge, "Ingress Layer", "Load Balancer / Ingress") {
        Container(apiGateway, "API Gateway (2 replicas)", "NestJS", "Routing, authentication, correlation ID propagation")
    }

    Deployment_Node(appCluster, "Application Cluster", "Kubernetes") {

        Container(userSvc, "User Service (2 replicas)", "NestJS", "User and profile management")

        Container(movieSvc, "Movie Service (2 replicas)", "NestJS", "Movie catalog and discovery")

        Container(cinemaSvc, "Cinema Service (2 replicas)", "NestJS", "Cinema, showtime, and seat metadata")

        Container(bookingSvc, "Booking Service (2 replicas)", "NestJS", "Booking workflow, seat reservation, payment coordination")

        Container(workerSvc, "Async Worker (2 replicas)", "Worker", "Outbox processing, notifications, retry handling")
    }

    Deployment_Node(dataTier, "Data Tier", "Managed Data Services") {

        ContainerDb(postgres, "PostgreSQL Cluster", "PostgreSQL", "Transactional databases with backup and PITR")

        ContainerDb(redis, "Redis Cluster", "Redis", "Caching, seat coordination, pub/sub")
    }

    Deployment_Node(obsTier, "Observability Tier", "Monitoring Stack") {
        Container(obs, "Telemetry Platform", "Logs + Metrics + Traces", "Centralized observability and alerting")
    }
}

Rel(web, apiGateway, "HTTPS")

Rel(apiGateway, clerk, "Validate JWT", "HTTPS")

Rel(apiGateway, userSvc, "Routes requests")
Rel(apiGateway, movieSvc, "Routes requests")
Rel(apiGateway, cinemaSvc, "Routes requests")
Rel(apiGateway, bookingSvc, "Routes requests")

Rel(userSvc, postgres, "Read/Write", "SQL")
Rel(movieSvc, postgres, "Read/Write", "SQL")
Rel(cinemaSvc, postgres, "Read/Write", "SQL")
Rel(bookingSvc, postgres, "Transactional operations", "SQL")

Rel(movieSvc, redis, "Cache access")
Rel(cinemaSvc, redis, "Cache access")
Rel(bookingSvc, redis, "Seat coordination + cache")
Rel(workerSvc, redis, "Queue / pub-sub")

Rel(bookingSvc, payment, "Payment requests", "HTTPS")
Rel(payment, bookingSvc, "Payment callbacks", "HTTPS")

Rel(workerSvc, notify, "Send notifications", "HTTPS")

Rel(apiGateway, obs, "Send telemetry")
Rel(bookingSvc, obs, "Send telemetry")
Rel(workerSvc, obs, "Send telemetry")
```

- Concern: production infrastructure mapping.
- Why it is separated: this view focuses on nodes, replicas, and connectivity, not business behavior.
- Quality attributes: availability, scalability, and reliability.
