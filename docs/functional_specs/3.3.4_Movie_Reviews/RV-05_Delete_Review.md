# [RV-05] Delete Review

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Review |
| **Functional ID** | RV-05 |
| **Description** | Allows an Administrator to delete a review (e.g., for moderation). Note: SRS also allows Members to delete their own, but trigger is usually Admin-focused in list. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/reviews/:id` |
| **Pre-condition** | Admin authenticated; Review ID exists. |
| **Post-condition** | Review record removed. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: DELETE /v1/reviews/:id
GW -> GW: Validate Admin Role
GW -> MS: Delete Review Request
MS -> DB: Find & Delete Review
alt Found
    DB --> MS: Success
    MS --> GW: 200 OK
else Not Found
    MS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Review for Moderation;
:(2) Request Deletion;
|API Gateway|
:(3) Validate Admin Auth;
|Movie Service|
:(4) Locate Review;
if (Found?) then (Yes)
    |Database|
    :(5) Delete Record;
    |API Gateway|
    :(6) Return Success;
    stop
else (No)
    |API Gateway|
    :(7) Return 404;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | General | Deleted reviews should also trigger a recalculation of the movie's aggregate rating. |
