# [TK-02] Find Ticket by Code

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Ticket by Code |
| **Functional ID** | TK-02 |
| **Description** | Allows a Member or Staff to retrieve ticket information using the unique alphanumeric ticket code (e.g., from a search or manual entry). |
| **Actor** | Member, Staff |
| **Trigger** | `GET /v1/tickets/code/:ticketCode` |
| **Pre-condition** | User authenticated; Ticket code exists. |
| **Post-condition** | Ticket information returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Member/Staff" as User
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

User -> GW: GET /v1/tickets/code/:ticketCode
GW -> BS: Find Ticket by Code Request
BS -> DB: SELECT * FROM Tickets WHERE ticketCode = :code
DB --> BS: Ticket Record
alt Found
    BS --> GW: Ticket Info DTO
    GW --> User: 200 OK
else Not Found
    BS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Input Ticket Code;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for Code;
|Database|
:(4) Return Data;
if (Found?) then (Yes)
    |API Gateway|
    :(5) Return Ticket Information;
    stop
else (No)
    |API Gateway|
    :(6) Return 404 Not Found;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Codes are unique across the entire system. |
| (3) | N/A | Staff can see any ticket, while Members can only see their own tickets. |
