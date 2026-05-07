# [PM-02] Get Promotion Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Promotion Details |
| **Functional ID** | PM-02 |
| **Description** | Retrieves full information about a specific promotion, including its terms and conditions. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/promotions/:id` |
| **Pre-condition** | Promotion ID exists. |
| **Post-condition** | Detailed promotion information returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

User -> GW: GET /v1/promotions/:id
GW -> BS: Get Promotion Detail Request
BS -> DB: Find Unique Promotion
alt Found
    DB --> BS: Promotion Record
    BS --> GW: Promotion Detail DTO
    GW --> User: 200 OK
else Not Found
    BS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Select Promotion;
|API Gateway|
:(2) Request Details;
|Booking Service|
:(3) Query DB for ID;
|Database|
:(4) Return Data;
if (Found?) then (Yes)
    |API Gateway|
    :(5) Return JSON;
    stop
else (No)
    |API Gateway|
    :(6) Return 404;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Standard read operation for a single promotion item. |
