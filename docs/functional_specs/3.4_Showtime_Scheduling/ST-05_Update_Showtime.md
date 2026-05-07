# [ST-05] Update Showtime

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Showtime |
| **Functional ID** | ST-05 |
| **Description** | Modifies an existing showtime's details (e.g., changing the hall, start time, or status). |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/showtimes/showtime/:id` |
| **Pre-condition** | Admin authenticated; Showtime exists; No bookings yet if changing time/hall. |
| **Post-condition** | Showtime record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: PATCH /v1/showtimes/showtime/:id
GW -> CS: Update Showtime Request
CS -> DB: Check for Bookings
alt No Bookings
    CS -> DB: Check new time conflict
    alt Safe
        CS -> DB: Update Fields
        DB --> CS: Success
        CS --> GW: 200 OK
    else Conflict
        CS --> GW: 409 Conflict
    end
else Has Bookings
    CS --> GW: 400 Bad Request (Cannot change hall/time with active bookings)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Showtime Update;
|API Gateway|
:(2) Validate Auth;
|Cinema Service|
:(3) Check for Active Bookings;
if (Has Bookings?) then (Yes)
    :(4) Restrict updates to Status only;
    if (Update Status?) then (Yes)
        |Database|
        :(5) Update Status;
    else (No)
        |API Gateway|
        :(6) Return Error;
        stop
    endif
else (No)
    :(7) Allow Hall/Time changes;
    |Database|
    :(8) Update Full Record;
endif
|API Gateway|
:(9) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | Changing Hall or Start Time is strictly prohibited if users have already booked tickets for that showtime. |
| (5) | SRS 5.2 | Valid statuses: `SCHEDULED`, `SELLING`, `SOLD_OUT`, `CANCELLED`, `COMPLETED`. |
