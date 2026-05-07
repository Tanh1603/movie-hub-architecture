# [ST-06] Delete Showtime

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Showtime |
| **Functional ID** | ST-06 |
| **Description** | Removes a scheduled showtime from the system. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/showtimes/showtime/:id` |
| **Pre-condition** | Admin authenticated; Showtime ID exists; No bookings associated with the showtime. |
| **Post-condition** | Showtime record deleted from database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: DELETE /v1/showtimes/showtime/:id
GW -> GW: Validate Admin Role
GW -> CS: Delete Showtime Request
CS -> DB: Check for active bookings
alt No Bookings
    CS -> DB: Delete Showtime Record
    DB --> CS: Success
    CS --> GW: 200 OK
else Has Bookings
    CS --> GW: 409 Conflict (Cannot delete showtime with active bookings)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Showtime Deletion;
|API Gateway|
:(2) Validate Authorization;
|Cinema Service|
:(3) Verify Showtime existence;
:(4) Check for associated bookings;
if (Safe to Delete?) then (Yes)
    |Database|
    :(5) Delete Record;
    |API Gateway|
    :(6) Return Success;
    stop
else (No)
    |API Gateway|
    :(7) Return 409 Conflict;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | General | Showtimes with confirmed or pending bookings cannot be physically deleted. They should be cancelled instead. |
