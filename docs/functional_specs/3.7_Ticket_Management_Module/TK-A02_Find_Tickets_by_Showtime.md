# [TK-A02] Find Tickets by Showtime

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Tickets by Showtime |
| **Functional ID** | TK-A02 |
| **Description** | Allows an Admin to view all tickets associated with a specific showtime. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/tickets/admin/showtime/:showtimeId` |
| **Pre-condition** | Admin authenticated; Showtime ID exists. |
| **Post-condition** | List of tickets for the showtime returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/tickets/admin/showtime/:id
GW -> BS: Get Tickets by Showtime Request
BS -> DB: SELECT * FROM Tickets WHERE bookingId IN (SELECT id FROM Bookings WHERE showtimeId = :id)
DB --> BS: List of Tickets
BS --> GW: Ticket List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Showtime for Ticket Report;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for tickets linked to showtime;
|Database|
:(4) Return Records;
|API Gateway|
:(5) Return List;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Useful for verifying seat occupancy for a specific screening. |
| (3) | N/A | Includes status of each ticket (VALID, USED, CANCELLED). |
