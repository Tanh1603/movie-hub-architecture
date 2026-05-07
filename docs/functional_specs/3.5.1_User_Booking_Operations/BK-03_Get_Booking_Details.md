# [BK-03] Get Booking Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Booking Details |
| **Functional ID** | BK-03 |
| **Description** | Retrieves full details of a specific booking, including tickets, concessions, and payment status. |
| **Actor** | Member |
| **Trigger** | `GET /v1/bookings/:id` |
| **Pre-condition** | Member authenticated; Booking ID exists and belongs to the member. |
| **Post-condition** | Full booking object returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/bookings/:id
GW -> BS: Get Booking Detail Request
BS -> DB: Find Unique Booking (Include Tickets, Concessions, Payments)
alt Found & Owner
    DB --> BS: Full Booking Object
    BS --> GW: Booking Detail DTO
    GW --> Member: 200 OK
else Forbidden/Not Found
    BS --> GW: 403 / 404
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) View Booking;
|API Gateway|
:(2) Request Detail;
|Booking Service|
:(3) Query DB;
|Database|
:(4) Return Data;
if (Is Owner?) then (Yes)
    |API Gateway|
    :(5) Return JSON;
    stop
else (No)
    |API Gateway|
    :(6) Return 403;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Includes QR code data for tickets if status is CONFIRMED. |
| (3) | SRS 5.1 | Hydrates data for Bookings, Tickets, Payments, and BookingConcessions. |
