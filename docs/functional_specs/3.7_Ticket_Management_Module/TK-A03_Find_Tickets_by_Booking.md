# [TK-A03] Find Tickets by Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Tickets by Booking |
| **Functional ID** | TK-A03 |
| **Description** | Retrieves all tickets belonging to a specific booking ID. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/tickets/admin/booking/:bookingId` |
| **Pre-condition** | Admin authenticated; Booking ID exists. |
| **Post-condition** | List of tickets for the booking returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/tickets/admin/booking/:id
GW -> BS: Get Tickets by Booking Request
BS -> DB: SELECT * FROM Tickets WHERE bookingId = :id
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
:(1) View Detailed Booking Record;
|API Gateway|
:(2) Request associated tickets;
|Booking Service|
:(3) Query DB for tickets;
|Database|
:(4) Return Records;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | A single booking can contain multiple tickets (up to 8, as per BR-SEAT-01). |
