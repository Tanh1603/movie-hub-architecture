# [MV-03] Get Movie Releases

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Movie Releases |
| **Functional ID** | MV-03 |
| **Description** | Retrieves the release dates and statuses for a specific movie in different regions or formats. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/movies/:id/releases` |
| **Pre-condition** | Movie ID exists. |
| **Post-condition** | List of releases returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/movies/:id/releases
GW -> MS: Get Releases for Movie
MS -> DB: SELECT * FROM MovieRelease WHERE movieId = :id
DB --> MS: List of Releases
MS --> GW: Release List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) View Movie Release Info;
|API Gateway|
:(2) Request Releases;
|Movie Service|
:(3) Query Database;
|Database|
:(4) Return Data;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Movie releases define the "Showing" or "Upcoming" status of a movie. |
