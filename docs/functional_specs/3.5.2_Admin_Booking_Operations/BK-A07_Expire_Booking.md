# [BK-A07] Expire Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Expire Booking |
| **Functional ID** | BK-A07 |
| **Description** | Manually expires a PENDING booking that has exceeded its allowed payment time window. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/bookings/admin/:id/expire` |
| **Pre-condition** | Admin authenticated; Booking status is PENDING. |
| **Post-condition** | Booking status set to EXPIRED; Seats released. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
control "Cinema Service" as CS
entity "Database (Booking)" as DB_B
entity "Database (Cinema)" as DB_C

Admin -> GW: POST /v1/bookings/admin/:id/expire
GW -> BS: Expire Booking Request
BS -> DB_B: Verify status is PENDING
alt PENDING
    BS -> DB_B: Update status = 'EXPIRED'
    BS -> CS: Release Reserved Seats
    CS -> DB_C: DELETE Seat Reservations
    DB_C --> CS: Success
    BS --> GW: 200 OK
else Not PENDING
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Manually Expire Booking;
|API Gateway|
:(2) Verify Permissions;
|Booking Service|
:(3) Check if status is PENDING;
if (Is PENDING?) then (Yes)
    |Database|
    :(4) Mark as EXPIRED;
    |Cinema Service|
    :(5) Release Seat Reservations;
    |API Gateway|
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
| (3) | BR-BOOK-01 | Bookings usually expire automatically after 15 minutes, but Admin can trigger this manually for cleanup. |
| (5) | N/A | Seats must be released immediately to make them available for others. |
