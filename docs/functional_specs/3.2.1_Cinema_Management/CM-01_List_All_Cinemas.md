# [CM-01] List All Cinemas

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List All Cinemas |
| **Functional ID** | CM-01 |
| **Description** | Retrieves a list of all active cinema locations available in the system. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas` |
| **Pre-condition** | None (Public endpoint). |
| **Post-condition** | List of cinemas returned to user. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas
GW -> CS: Get All Cinemas
CS -> DB: Select * FROM Cinemas WHERE status = 'ACTIVE'
DB --> CS: List of Cinema Records
CS --> GW: Cinema List DTO
GW --> User: 200 OK (JSON)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Request Cinema List;
|API Gateway|
:(2) Route to Cinema Service;
|Cinema Service|
:(3) Query Active Cinemas;
|Database|
:(4) Return Records;
|Cinema Service|
:(5) Map to DTO (Hide internal fields);
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Only cinemas with `CinemaStatus` = `ACTIVE` should be visible to public users. |
