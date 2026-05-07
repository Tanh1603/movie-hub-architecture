# [TK-A05] Cancel Ticket

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Cancel Ticket |
| **Functional ID** | TK-A05 |
| **Description** | Allows an Admin to manually cancel an individual ticket (without necessarily cancelling the entire booking). |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/tickets/admin/:id/cancel` |
| **Pre-condition** | Admin authenticated; Ticket status is `VALID`. |
| **Post-condition** | Ticket status updated to `CANCELLED`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/tickets/admin/:id/cancel
GW -> BS: Cancel Ticket Request
BS -> DB: Find Ticket
alt VALID
    BS -> DB: Update Status = 'CANCELLED'
    DB --> BS: Success
    BS --> GW: 200 OK
else Not Valid
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Ticket for Cancellation;
|API Gateway|
:(2) Verify Permissions;
|Booking Service|
:(3) Check if status is VALID;
if (Is VALID?) then (Yes)
    |Database|
    :(4) Update status to CANCELLED;
    |API Gateway|
    :(5) Return Success;
    stop
else (No)
    |API Gateway|
    :(6) Return Error (Ticket already used or expired);
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | Transitioning a ticket to `CANCELLED` makes the corresponding seat available in the database (via cascading effects or manual trigger). |
