# [HM-02] Get Halls of Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Halls of Cinema |
| **Functional ID** | HM-02 |
| **Description** | Retrieves a list of all halls belonging to a specific cinema location. |
| **Actor** | Member, Admin |
| **Trigger** | `GET /v1/halls/cinema/:cinemaId` |
| **Pre-condition** | Cinema ID exists; User authenticated. |
| **Post-condition** | List of halls returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/halls/cinema/:cinemaId
GW -> GW: Validate Auth
GW -> CS: Get Halls for Cinema
CS -> DB: SELECT * FROM Halls WHERE cinemaId = :id
DB --> CS: List of Halls
CS --> GW: Hall List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Request Cinema's Halls;
|API Gateway|
:(2) Validate Auth;
|Cinema Service|
:(3) Query Halls by Cinema ID;
|Database|
:(4) Return List;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Should return halls regardless of status (Active/Maintenance) for Admins, but maybe filter for Members? (SRS implies general access, assumed all visible). |
