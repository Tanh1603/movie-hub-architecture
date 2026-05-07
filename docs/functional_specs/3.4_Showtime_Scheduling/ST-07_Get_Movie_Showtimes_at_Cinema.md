# [ST-07] Get Movie Showtimes at Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Movie Showtimes at Cinema |
| **Functional ID** | ST-07 |
| **Description** | Retrieves all available showtimes for a specific movie at a specific cinema location. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/:cinemaId/movies/:movieId/showtimes` |
| **Pre-condition** | Cinema ID and Movie ID exist. |
| **Post-condition** | List of showtimes (grouped by date/format) returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/:cinemaId/movies/:movieId/showtimes
GW -> CS: Get Showtimes Request
CS -> DB: SELECT * FROM Showtimes WHERE cinemaId = :cId AND movieId = :mId AND status = 'SELLING'
DB --> CS: List of Showtimes
CS --> GW: Showtime Schedule DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Select Cinema & Movie;
|API Gateway|
:(2) Forward Request;
|Cinema Service|
:(3) Query active showtimes;
|Database|
:(4) Return Records;
|Cinema Service|
:(5) Group by Date and Screening Format;
|API Gateway|
:(6) Return Schedule JSON;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Only showtimes with status `SELLING` or `SCHEDULED` are returned to the public. |
| (5) | SRS 5.2 | Results are categorized by format (2D, 3D, IMAX) for better user experience. |
