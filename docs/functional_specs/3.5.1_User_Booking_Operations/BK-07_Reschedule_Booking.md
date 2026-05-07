# [BK-07] Reschedule Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Reschedule Booking |
| **Functional ID** | BK-07 |
| **Description** | Allows a Member to change the showtime of an existing CONFIRMED booking, subject to limits and time constraints. |
| **Actor** | Member |
| **Trigger** | `POST /v1/bookings/:id/reschedule` |
| **Pre-condition** | Booking status is CONFIRMED; New showtime exists; At least 2 hours before original showtime. |
| **Post-condition** | Original booking cancelled; New booking created or updated; Reschedule count incremented. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
control "Cinema Service" as CS
entity "Database (Booking)" as DB_B
entity "Database (Cinema)" as DB_C

Member -> GW: POST /v1/bookings/:id/reschedule (newShowtimeId)
GW -> BS: Reschedule Request
BS -> DB_B: Check rescheduleCount < MAX_RESCHEDULES
BS -> DB_B: Check time >= 2 hours before showtime
alt Allowed
    BS -> CS: Release Old Seats
    BS -> CS: Hold New Seats
    BS -> DB_B: Update Booking (new showtime, inc rescheduleCount)
    DB_B --> BS: Success
    BS --> GW: 200 OK
else Limit Reached / Too Late
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request Reschedule;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Check BR-BOOK-04: Max reschedules (1);
:(4) Check BR-BOOK-05: 2 hours before showtime;
if (Eligible?) then (Yes)
    |Cinema Service|
    :(5) Release Old Seats;
    :(6) Reserve New Seats;
    |Booking Service|
    :(7) Update Booking Record;
    :(8) Increment Reschedule Count;
    |API Gateway|
    :(9) Return Success;
    stop
else (No)
    |API Gateway|
    :(10) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-BOOK-04 | Maximum reschedules per booking: 1. |
| (4) | BR-BOOK-05 | Rescheduling must be made at least 2 hours before showtime. |
| (7) | N/A | Total price may need adjustment if new showtime has different pricing. |
