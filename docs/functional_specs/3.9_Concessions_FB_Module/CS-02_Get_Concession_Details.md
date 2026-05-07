# [CS-02] Get Concession Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Concession Details |
| **Functional ID** | CS-02 |
| **Description** | Retrieves full information about a specific concession item, including description, ingredients, and nutritional info (if available). |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/concessions/:id` |
| **Pre-condition** | Concession ID exists. |
| **Post-condition** | Detailed concession information returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

User -> GW: GET /v1/concessions/:id
GW -> BS: Get Concession Detail Request
BS -> DB: Find Unique Concession
alt Found
    DB --> BS: Concession Record
    BS --> GW: Concession Detail DTO
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
:(1) Select Concession Item;
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
| (1) | N/A | Standard read operation for a single concession item. |
