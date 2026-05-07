# [ST-09] Get Movies at Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Movies at Cinema |
| **Functional ID** | ST-09 |
| **Description** | Lists all movies that currently have scheduled showtimes at a specific cinema location. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/cinema/:cinemaId/movies` |
| **Pre-condition** | Cinema ID exists. |
| **Post-condition** | List of movies with active showtimes returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
control "Movie Service" as MS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/cinema/:id/movies
GW -> CS: Get Movies at Cinema Request
CS -> DB: SELECT DISTINCT movieId FROM Showtimes WHERE cinemaId = :id AND status = 'SELLING'
DB --> CS: List of Movie IDs
CS -> MS: Get Movies Metadata (Ids)
MS --> CS: Movie Objects (Titles, Posters)
CS --> GW: Movie List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Browse Cinema Program;
|API Gateway|
:(2) Forward Request;
|Cinema Service|
:(3) Identify movies with active showtimes;
|Database|
:(4) Return Movie IDs;
|Movie Service|
:(5) Hydrate Movie Metadata;
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Only movies with at least one showtime in `SELLING` status are included. |
