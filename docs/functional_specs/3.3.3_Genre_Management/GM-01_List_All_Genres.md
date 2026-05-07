# [GM-01] List All Genres

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List All Genres |
| **Functional ID** | GM-01 |
| **Description** | Retrieves a list of all movie genres available in the system. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/genres` |
| **Pre-condition** | None. |
| **Post-condition** | List of genres returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/genres
GW -> MS: Get All Genres Request
MS -> DB: SELECT * FROM Genre
DB --> MS: List of Genre Records
MS --> GW: Genre List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Request Genre List;
|API Gateway|
:(2) Forward Request;
|Movie Service|
:(3) Query Database;
|Database|
:(4) Return Records;
|Movie Service|
:(5) Map to Genre DTO;
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Returns all genres defined in the movie service database. |
