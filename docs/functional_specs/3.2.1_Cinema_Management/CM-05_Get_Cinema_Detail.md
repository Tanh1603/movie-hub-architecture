# [CM-05] Get Cinema Detail

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Cinema Detail |
| **Functional ID** | CM-05 |
| **Description** | Retrieves full details of a specific cinema, including amenities, address, and description. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/:id` |
| **Pre-condition** | None. |
| **Post-condition** | Detailed cinema object returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/:id
GW -> CS: Get Cinema By ID
CS -> DB: Find Unique
alt Found
    DB --> CS: Cinema Record
    CS --> GW: Cinema Details
else Not Found
    CS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Select Cinema;
|API Gateway|
:(2) Request Details;
|Cinema Service|
:(3) Query DB;
|Database|
:(4) Return Data;
if (Found?) then (Yes)
    |API Gateway|
    :(5) Return JSON;
    stop
else (No)
    :(6) Return 404;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Standard Read Operation. |
