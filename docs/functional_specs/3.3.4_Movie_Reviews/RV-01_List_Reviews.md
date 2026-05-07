# [RV-01] List Reviews

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Reviews |
| **Functional ID** | RV-01 |
| **Description** | Retrieves a list of all reviews in the system, supporting administrative oversight. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/reviews` |
| **Pre-condition** | None. |
| **Post-condition** | List of all reviews returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

User -> GW: GET /v1/reviews
GW -> MS: Get All Reviews
MS -> DB: SELECT * FROM Review
DB --> MS: List of Review Records
MS --> GW: Review List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Request All Reviews;
|API Gateway|
:(2) Forward Request;
|Movie Service|
:(3) Query Database;
|Database|
:(4) Return Records;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Typically used for general review feeds or admin moderation. |
| (1) | BR-REVIEW-02 | Ratings are on a scale of 1 to 5. |
