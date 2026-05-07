# [BK-10] Check User Booking at Showtime

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Check User Booking at Showtime |
| **Functional ID** | BK-10 |
| **Description** | Checks if the user already has a pending or confirmed booking for a specific showtime. |
| **Actor** | Member |
| **Trigger** | `GET /v1/bookings/showtime/:showtimeId/check` |
| **Pre-condition** | Member authenticated. |
| **Post-condition** | Boolean status and booking ID (if exists) returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/bookings/showtime/:id/check
GW -> BS: Check Booking Request
BS -> DB: SELECT * FROM Bookings WHERE userId = :uId AND showtimeId = :sId AND status IN [PENDING, CONFIRMED]
DB --> BS: Record or null
BS --> GW: Check Result DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Navigate to Seat Selection;
|API Gateway|
:(2) Check for existing booking;
|Booking Service|
:(3) Query active bookings for (User, Showtime);
|Database|
:(4) Return result;
if (Exists?) then (Yes)
    |API Gateway|
    :(5) Return true + Booking ID;
else (No)
    |API Gateway|
    :(6) Return false;
endif
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-BOOK-02 | Prevents users from creating multiple active bookings for the same showtime. |
