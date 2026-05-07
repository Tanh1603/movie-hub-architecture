# [TP-01] Get Pricing for Hall

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Pricing for Hall |
| **Functional ID** | TP-01 |
| **Description** | Retrieves the ticket pricing configuration for a specific hall, which includes pricing by seat type (Standard, VIP, etc.) and day type (Weekday, Weekend, Holiday). |
| **Actor** | Admin |
| **Trigger** | `GET /v1/ticket-pricings/hall/:hallId` |
| **Pre-condition** | Admin authenticated; Hall ID exists. |
| **Post-condition** | List of pricing rules for the hall is returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: GET /v1/ticket-pricings/hall/:hallId
GW -> GW: Validate Admin Role
GW -> CS: Get Pricing Request
CS -> DB: SELECT * FROM TicketPricing WHERE hallId = :id
DB --> CS: List of Pricing Records
CS --> GW: Pricing List DTO
GW --> Admin: 200 OK (JSON)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Hall to view pricing;
|API Gateway|
:(2) Verify Admin Credentials;
|Cinema Service|
:(3) Query Pricing for Hall;
|Database|
:(4) Return Pricing Rules;
|Cinema Service|
:(5) Format Pricing DTO;
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | Pricing is defined by the combination of `SeatType` and `DayType`. |
