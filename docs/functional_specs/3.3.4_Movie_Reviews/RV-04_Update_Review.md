# [RV-04] Update Review

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Review |
| **Functional ID** | RV-04 |
| **Description** | Allows a Member to modify their own review and rating for a movie. |
| **Actor** | Member |
| **Trigger** | `PUT /v1/movies/:id/reviews/:reviewId` |
| **Pre-condition** | Member authenticated; Review ID exists and belongs to the Member. |
| **Post-condition** | Review record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Member -> GW: PUT /v1/movies/:id/reviews/:reviewId
GW -> GW: Validate Auth
GW -> MS: Update Review Request
MS -> DB: Find Review & Verify Ownership
alt Owner
    MS -> DB: Update Review Fields
    DB --> MS: Success
    MS --> GW: 200 OK
else Not Owner / Not Found
    MS --> GW: 403 Forbidden / 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Edit Rating/Content;
:(2) Submit Update;
|API Gateway|
:(3) Validate Auth;
|Movie Service|
:(4) Verify Review Ownership;
if (Is Owner?) then (Yes)
    :(5) Apply Changes to DB;
    |Database|
    :(6) Commit Update;
    |API Gateway|
    :(7) Return Success;
    stop
else (No)
    |API Gateway|
    :(8) Return 403 Forbidden;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | General | Users can only update reviews they created themselves. |
| (5) | BR-REVIEW-02 | New rating must be between 1 and 5. |
