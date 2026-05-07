# [MR-03] Delete Movie Release

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Movie Release |
| **Functional ID** | MR-03 |
| **Description** | Deletes a movie release entry. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/movie-releases/:id` |
| **Pre-condition** | Admin authenticated; Release exists. |
| **Post-condition** | Release record removed. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: DELETE /v1/movie-releases/:id
GW -> GW: Validate Admin Role
GW -> MS: Delete Release Request
MS -> DB: Check for active showtimes using this release
alt Safe
    MS -> DB: Delete Release
    DB --> MS: Success
    MS --> GW: 200 OK
else Has Showtimes
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
if (Has Showtimes?) then (Yes)
    |API Gateway|
    :(4) Return 409 Conflict;
    stop
else (No)
    |Database|
    :(5) Delete Record;
    |API Gateway|
    :(6) Return Success;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | Deleting a release is prevented if it's currently linked to active showtimes. |
