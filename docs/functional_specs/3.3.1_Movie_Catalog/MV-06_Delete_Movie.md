# [MV-06] Delete Movie

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Movie |
| **Functional ID** | MV-06 |
| **Description** | Removes a movie from the catalog. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/movies/:id` |
| **Pre-condition** | Admin authenticated; No active showtimes linked. |
| **Post-condition** | Movie deleted. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: DELETE /v1/movies/:id
GW -> GW: Check Admin Role
GW -> MS: Delete Request
MS -> DB: Check for Active Showtimes
alt No Dependencies
    MS -> DB: Delete Movie Record
    DB --> MS: Success
    MS --> GW: 200 OK
else Has Active Showtimes
    MS --> GW: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Deletion;
|API Gateway|
:(2) Validate Role;
|Movie Service|
:(3) Check Showtime Dependencies;
if (Safe?) then (Yes)
    |Database|
    :(4) Delete Movie;
    |API Gateway|
    :(5) Return Success;
    stop
else (No)
    |API Gateway|
    :(6) Return 409 Conflict;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | A movie cannot be deleted if it is currently scheduled for screening (to prevent orphaned showtimes). |
