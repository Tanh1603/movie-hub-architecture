# C4 Level 4 - Deployment Diagram (MovieHub)

```mermaid
C4Deployment
  title Deployment diagram for MovieHub (production)

  Deployment_Node(client, "End User Device", "Browser/Mobile") {
    Container(web, "Web App", "Next.js", "Client application")
  }

  Deployment_Node(cloud, "Cloud Region", "Managed cloud") {
    Deployment_Node(edge, "Load Balancer", "Ingress") {
      Container(apigwPods, "API Gateway Pods", "NestJS", "Ingress and routing")
    }

    Deployment_Node(appCluster, "Application Cluster", "Kubernetes") {
      Container(userSvcPods, "User Service Pods", "NestJS", "User service replicas")
      Container(movieSvcPods, "Movie Service Pods", "NestJS", "Movie service replicas")
      Container(cinemaSvcPods, "Cinema Service Pods", "NestJS", "Cinema service replicas")
      Container(bookingSvcPods, "Booking Service Pods", "NestJS", "Booking service replicas")
      Container(workerPods, "Async Worker Pods", "Worker", "Background worker replicas")
    }

    Deployment_Node(dataTier, "Data Tier", "Managed data services") {
      ContainerDb(pgCluster, "PostgreSQL Cluster", "PostgreSQL", "Service databases")
      ContainerDb(redisCluster, "Redis", "Redis", "Shared cache")
    }

    Deployment_Node(obsTier, "Observability", "Managed monitoring") {
      Container(obs, "Observability Stack", "Monitoring", "Central telemetry")
    }
  }

  System_Ext(clerk, "Clerk", "Authentication provider")
  System_Ext(payment, "Payment Gateway", "Payment provider")
  System_Ext(notify, "Notification Provider", "Notification provider")

  Rel(web, apigwPods, "Calls", "HTTPS")
  Rel(apigwPods, clerk, "Calls", "HTTPS")

  Rel(apigwPods, userSvcPods, "Routes")
  Rel(apigwPods, movieSvcPods, "Routes")
  Rel(apigwPods, cinemaSvcPods, "Routes")
  Rel(apigwPods, bookingSvcPods, "Routes")

  Rel(userSvcPods, pgCluster, "Reads/Writes", "SQL")
  Rel(movieSvcPods, pgCluster, "Reads/Writes", "SQL")
  Rel(cinemaSvcPods, pgCluster, "Reads/Writes", "SQL")
  Rel(bookingSvcPods, pgCluster, "Reads/Writes", "SQL")

  Rel(movieSvcPods, redisCluster, "Reads")
  Rel(cinemaSvcPods, redisCluster, "Reads")
  Rel(bookingSvcPods, redisCluster, "Reads")
  Rel(workerPods, redisCluster, "Reads")

  Rel(bookingSvcPods, payment, "Calls", "HTTPS")
  Rel(payment, bookingSvcPods, "Calls", "HTTPS")
  Rel(workerPods, notify, "Sends", "HTTPS")

  Rel(apigwPods, obs, "Sends telemetry")
  Rel(bookingSvcPods, obs, "Sends telemetry")
```

- Concern: production infrastructure mapping.
- Why it is separated: this view focuses on nodes, replicas, and connectivity, not business behavior.
- Quality attributes: availability, scalability, and reliability.
