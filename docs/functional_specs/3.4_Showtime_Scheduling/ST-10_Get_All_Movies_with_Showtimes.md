# [ST-10] Get All Movies with Showtimes

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get All Movies with Showtimes |
| **Functional ID** | ST-10 |
| **Description** | Aggregates all movies across the platform that currently have active showtimes, often used for a "Now Showing" landing page. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/movies/showtimes` |
| **Pre-condition** | None. |
| **Post-condition** | Aggregated list of movies with their associated cinemas/times. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
control "Movie Service" as MS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/movies/showtimes
GW -> CS: Get Now Showing Aggregation
CS -> DB: SELECT movieId, cinemaId FROM Showtimes WHERE status = 'SELLING'
DB --> CS: Raw Mapping
CS -> MS: Get Movie Metadata (Ids)
MS --> CS: Movie Objects
CS -> CS: Group Cinemas by Movie
CS --> GW: Aggregated Response
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) View 'Now Showing' Page;
|API Gateway|
:(2) Request Aggregation;
|Cinema Service|
:(3) Query all active showtimes globally;
|Database|
:(4) Return Raw Mappings;
|Movie Service|
:(5) Fetch Movie Details;
|Cinema Service|
:(6) Aggregate into 'Movie -> Cinemas' structure;
|API Gateway|
:(7) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Filters out movies that have no available showtimes left for the day. |
| (6) | N/A | Typically sorted by movie popularity or release date. |
