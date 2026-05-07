# [ST-03] Create Showtime

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Showtime |
| **Functional ID** | ST-03 |
| **Description** | Allows an Admin to schedule a single movie screening in a specific hall at a specific time. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/showtimes/showtime` |
| **Pre-condition** | Admin authenticated; Movie, Hall, and Release IDs exist; No time overlap in the same hall. |
| **Post-condition** | New Showtime created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: POST /v1/showtimes/showtime
GW -> GW: Validate Admin Role
GW -> CS: Create Showtime DTO
CS -> DB: Check Hall Availability (Overlap check)
alt No Overlap
    CS -> DB: Insert Showtime
    DB --> CS: Success
    CS --> GW: 201 Created
else Overlap Detected
    CS --> GW: 409 Conflict (Hall Busy)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Movie, Hall, Start Time;
:(2) Submit Showtime;
|API Gateway|
:(3) Validate Authorization;
|Cinema Service|
:(4) Verify Hall Status (ACTIVE);
:(5) Check for Overlapping Schedules;
if (No Overlap?) then (Yes)
    |Database|
    :(6) Insert Showtime Record;
    |API Gateway|
    :(7) Return Success;
    stop
else (No)
    |API Gateway|
    :(8) Return 409 Conflict;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | General | A hall cannot have two showtimes that overlap in time (including a buffer for cleaning). |
| (4) | SRS 5.2 | Showtime status defaults to `SCHEDULED` or `SELLING`. |
