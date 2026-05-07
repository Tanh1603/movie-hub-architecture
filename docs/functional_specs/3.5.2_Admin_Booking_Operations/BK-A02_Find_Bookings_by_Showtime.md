# [BK-A02] Find Bookings by Showtime

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Bookings by Showtime |
| **Functional ID** | BK-A02 |
| **Description** | Allows an Admin to view all bookings associated with a specific showtime. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/bookings/admin/showtime/:showtimeId` |
| **Pre-condition** | Admin authenticated; Showtime ID exists. |
| **Post-condition** | List of bookings for the showtime returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/bookings/admin/showtime/:id
GW -> BS: Get Bookings by Showtime Request
BS -> DB: SELECT * FROM Bookings WHERE showtimeId = :id
DB --> BS: List of Bookings
BS --> GW: Booking List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Showtime for Inspection;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for showtimeId;
|Database|
:(4) Return associated bookings;
|API Gateway|
:(5) Return List;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Useful for checking attendance or managing issues for a specific screening. |
