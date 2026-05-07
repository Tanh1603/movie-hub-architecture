# [RF-03] Get Refund Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Refund Details |
| **Functional ID** | RF-03 |
| **Description** | Retrieves full information about a specific refund request. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/refunds/:id` |
| **Pre-condition** | Admin authenticated; Refund ID exists. |
| **Post-condition** | Refund details returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/refunds/:id
GW -> BS: Get Refund Detail Request
BS -> DB: Find Unique Refund
alt Found
    DB --> BS: Refund Record
    BS --> GW: Refund Detail DTO
    GW --> Admin: 200 OK
else Not Found
    BS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Refund Request;
|API Gateway|
:(2) Request Details;
|Booking Service|
:(3) Query DB for ID;
|Database|
:(4) Return Data;
if (Found?) then (Yes)
    |API Gateway|
    :(5) Return Details;
    stop
else (No)
    |API Gateway|
    :(6) Return 404 Not Found;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Standard administrative read operation. |
