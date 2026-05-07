# [GM-02] Get Genre by ID

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Genre by ID |
| **Functional ID** | GM-02 |
| **Description** | Retrieves detailed information about a specific genre by its ID. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/genres/:id` |
| **Pre-condition** | Genre ID exists. |
| **Post-condition** | Genre details returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/genres/:id
GW -> MS: Get Genre Detail Request
MS -> DB: Find Unique Genre
alt Found
    DB --> MS: Genre Object
    MS --> GW: Genre Detail DTO
    GW --> User: 200 OK
else Not Found
    MS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Request Genre Details;
|API Gateway|
:(2) Request Detail;
|Movie Service|
:(3) Query DB for Genre ID;
|Database|
:(4) Return Genre Data;
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
| (1) | N/A | Standard read operation for a single genre. |
