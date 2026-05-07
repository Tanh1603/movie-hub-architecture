# [HM-01] Get Hall by ID

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Hall by ID |
| **Functional ID** | HM-01 |
| **Description** | Retrieves detailed information about a specific cinema hall, including its seat layout and type. |
| **Actor** | Member, Admin |
| **Trigger** | `GET /v1/halls/hall/:hallId` |
| **Pre-condition** | Hall ID exists; User is authenticated. |
| **Post-condition** | Hall details and seat matrix returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/halls/hall/:hallId
GW -> GW: Validate Auth
GW -> CS: Get Hall Request
CS -> DB: Find Hall by ID (include Seats)
alt Found
    DB --> CS: Hall + Seats Data
    CS --> GW: Hall DTO
    GW --> User: 200 OK
else Not Found
    DB --> CS: null
    CS --> GW: 404 Not Found
    GW --> User: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Request Hall Details;
|API Gateway|
:(2) Verify Token;
|Cinema Service|
:(3) Query Hall ID;
|Database|
:(4) Fetch Hall & Seat Map;
|Cinema Service|
:(5) Transform Data;
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Returns full seat layout including row/col coordinates and types (VIP/Standard). |
