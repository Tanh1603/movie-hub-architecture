# [TK-01] Get Ticket Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Ticket Details |
| **Functional ID** | TK-01 |
| **Description** | Retrieves full information about a specific digital ticket, including seat number, showtime details, and its current validity status. |
| **Actor** | Member |
| **Trigger** | `GET /v1/tickets/:id` |
| **Pre-condition** | Member authenticated; Ticket ID exists and belongs to the member. |
| **Post-condition** | Ticket details returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/tickets/:id
GW -> BS: Get Ticket Request
BS -> DB: Find Unique Ticket
alt Found & Owner
    DB --> BS: Ticket Record
    BS --> GW: Ticket Detail DTO
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
:(1) Select Ticket to View;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for Ticket;
|Database|
:(4) Return Data;
if (Is Owner?) then (Yes)
    |API Gateway|
    :(5) Return Ticket JSON;
    stop
else (No)
    |API Gateway|
    :(6) Return 403 Forbidden;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Ticket status must be one of the `TicketStatus` enum values. |
| (3) | N/A | Only the member who bought the ticket can view its detailed information. |
