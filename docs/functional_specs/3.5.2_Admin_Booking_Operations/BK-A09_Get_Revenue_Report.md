# [BK-A09] Get Revenue Report

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Revenue Report |
| **Functional ID** | BK-A09 |
| **Description** | Generates a report of total revenue generated from bookings within a specific period, broken down by movie or cinema. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/bookings/admin/revenue-report` |
| **Pre-condition** | Admin authenticated; Valid date range and grouping parameters. |
| **Post-condition** | Revenue report data returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/bookings/admin/revenue-report?start=...&end=...&groupBy=movie
GW -> BS: Get Revenue Request
BS -> DB: SELECT movieId, sum(totalPrice) FROM Bookings WHERE status='COMPLETED' AND createdAt BETWEEN :start AND :end GROUP BY movieId
DB --> BS: Raw Totals
BS -> BS: Format Report
BS --> GW: Revenue Report DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Revenue Report;
|API Gateway|
:(2) Validate Permissions;
|Booking Service|
:(3) Query Sum of COMPLETED bookings;
|Database|
:(4) Return Aggregated Revenue;
|Booking Service|
:(5) Generate Breakdown;
|API Gateway|
:(6) Return Report JSON;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Only `COMPLETED` (and possibly `CONFIRMED`) bookings are counted towards revenue. `CANCELLED` or `EXPIRED` are excluded. |
| (3) | BR-PAY-03 | Reports should clearly distinguish between gross revenue and net revenue (minus 10% VAT). |
