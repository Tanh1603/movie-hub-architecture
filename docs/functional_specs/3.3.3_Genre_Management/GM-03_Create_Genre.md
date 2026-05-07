# [GM-03] Create Genre

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Genre |
| **Functional ID** | GM-03 |
| **Description** | Allows an Administrator to add a new movie genre to the system. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/genres` |
| **Pre-condition** | Admin authenticated; Valid payload (name). |
| **Post-condition** | New genre created in database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: POST /v1/genres
GW -> GW: Check Admin Role
GW -> MS: Create Genre DTO
MS -> DB: Check Name Uniqueness
alt Unique
    MS -> DB: Insert Genre
    DB --> MS: Created Record
    MS --> GW: 201 Created
    GW --> Admin: Success Response
else Duplicate Name
    MS --> GW: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Input Genre Name;
:(2) Submit Request;
|API Gateway|
:(3) Validate Permissions;
|Movie Service|
:(4) Check Duplicate Name;
if (Unique?) then (Yes)
    |Database|
    :(5) Insert Record;
    |Movie Service|
    :(6) Return Success;
    stop
else (No)
    |API Gateway|
    :(7) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | General | Genre names must be unique in the system. |
