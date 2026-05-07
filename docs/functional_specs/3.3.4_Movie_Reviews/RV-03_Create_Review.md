# [RV-03] Create Review

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Review |
| **Functional ID** | RV-03 |
| **Description** | Allows a Member to submit a review and rating for a movie they have (presumably) seen. |
| **Actor** | Member |
| **Trigger** | `POST /v1/movies/:id/reviews` |
| **Pre-condition** | Member authenticated; Movie ID exists; Member has not reviewed this movie yet. |
| **Post-condition** | Review created; Average movie rating updated (if calculated on fly). |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Member -> GW: POST /v1/movies/:id/reviews (Rating, Content)
GW -> GW: Validate Auth
GW -> MS: Create Review Request
MS -> DB: Check Existing Review (User+Movie)
alt No Review Exists
    MS -> DB: Insert Review
    DB --> MS: Success
    MS --> GW: 201 Created
else Already Reviewed
    MS --> GW: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Input Rating (1-5) & Review;
:(2) Submit Review;
|API Gateway|
:(3) Validate Authorization;
|Movie Service|
:(4) Check Rule: One review per user;
if (Already Reviewed?) then (Yes)
    |API Gateway|
    :(5) Return 409 Conflict;
    stop
else (No)
    |Database|
    :(6) Save Review;
    |Movie Service|
    :(7) Return Success;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | BR-REVIEW-01 | One user can only submit one review per movie. |
| (1) | BR-REVIEW-02 | Rating scale: 1 to 5. |
