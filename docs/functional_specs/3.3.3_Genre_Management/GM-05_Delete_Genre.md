# [GM-05] Delete Genre

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Genre |
| **Functional ID** | GM-05 |
| **Description** | Removes a movie genre from the system. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/genres/:id` |
| **Pre-condition** | Admin authenticated; Genre ID exists. |
| **Post-condition** | Genre record removed. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: DELETE /v1/genres/:id
GW -> GW: Check Admin Role
GW -> MS: Delete Request
MS -> DB: Check for Movie Associations
alt No Movies Linked
    MS -> DB: Delete Genre Record
    DB --> MS: Success
    MS --> GW: 200 OK
else Has Linked Movies
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
:(3) Check Movie Associations;
if (Safe?) then (Yes)
    |Database|
    :(4) Delete Genre;
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
| (3) | General | A genre cannot be deleted if there are movies currently associated with it. |
