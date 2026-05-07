# [MV-02] Get Movie Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Movie Details |
| **Functional ID** | MV-02 |
| **Description** | Retrieves comprehensive information about a specific movie, including its overview, cast, crew, and genres. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/movies/:id` |
| **Pre-condition** | Movie ID exists. |
| **Post-condition** | Detailed movie information returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/movies/:id
GW -> MS: Get Movie Detail Request
MS -> DB: Find Unique Movie (include Genres)
alt Found
    DB --> MS: Full Movie Object
    MS --> GW: Movie Detail DTO
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
:(1) Select a Movie;
|API Gateway|
:(2) Request Details;
|Movie Service|
:(3) Query DB for Movie ID;
|Database|
:(4) Return Movie Data;
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
| (4) | N/A | Includes Title, Overview, Release Date, Trailer URL, Poster, Backdrop, Runtime, and Age Rating (SRS 5.1). |
