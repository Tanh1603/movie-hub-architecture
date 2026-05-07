# [MV-01] List Movies

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Movies |
| **Functional ID** | MV-01 |
| **Description** | Retrieves a list of movies available in the catalog, supporting pagination, searching, and filtering by genre or age rating. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/movies` |
| **Pre-condition** | None. |
| **Post-condition** | List of movies returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/movies?page=1&limit=10&genre=Action
GW -> MS: Get Movies Request (Filters)
MS -> DB: SELECT * FROM Movie WHERE ... (with Pagination)
DB --> MS: Movie List + Total Count
MS --> GW: Movie List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Browse Movies;
|API Gateway|
:(2) Forward Request;
|Movie Service|
:(3) Parse Search/Filter Params;
:(4) Query Database;
|Database|
:(5) Return Records;
|Movie Service|
:(6) Map to Movie Card DTO;
|API Gateway|
:(7) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Supports filtering by `genre`, `ageRating`, and searching by `title`. |
| (6) | SRS 5.2 | Returns basic info: Title, Poster, Age Rating, Duration. |
