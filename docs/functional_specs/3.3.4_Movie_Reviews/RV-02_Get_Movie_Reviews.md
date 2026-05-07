# [RV-02] Get Movie Reviews

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Movie Reviews |
| **Functional ID** | RV-02 |
| **Description** | Retrieves all reviews and ratings for a specific movie. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/movies/:id/reviews` |
| **Pre-condition** | Movie ID exists. |
| **Post-condition** | List of reviews for the movie returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/movies/:id/reviews
GW -> MS: Get Movie Reviews Request
MS -> DB: SELECT * FROM Review WHERE movieId = :id
DB --> MS: List of Movie Reviews
MS --> GW: Review List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) View Movie Reviews;
|API Gateway|
:(2) Request Reviews;
|Movie Service|
:(3) Query Database for Movie ID;
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
| (3) | N/A | Reviews should include user names (or obfuscated IDs) and rating values. |
