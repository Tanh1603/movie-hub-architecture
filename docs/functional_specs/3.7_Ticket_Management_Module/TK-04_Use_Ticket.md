# [TK-04] Use Ticket (Mark Entry)

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Use Ticket (Mark Entry) |
| **Functional ID** | TK-04 |
| **Description** | Marks a ticket as `USED` when the customer enters the cinema hall. This prevents the same ticket from being used twice. |
| **Actor** | Staff |
| **Trigger** | `POST /v1/tickets/:id/use` |
| **Pre-condition** | Staff authenticated; Ticket status is `VALID`. |
| **Post-condition** | Ticket status updated to `USED`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Staff
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Staff -> GW: POST /v1/tickets/:id/use
GW -> BS: Use Ticket Request
BS -> DB: Find Ticket
alt Status == 'VALID'
    BS -> DB: Update Ticket SET status = 'USED'
    DB --> BS: Success
    BS --> GW: 200 OK
else Already Used/Invalid
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Staff|
start
:(1) Scan Ticket for Entry;
|API Gateway|
:(2) Forward Use Request;
|Booking Service|
:(3) Check if status is VALID;
if (Is VALID?) then (Yes)
    |Database|
    :(4) Update status to USED;
    |API Gateway|
    :(5) Return Success;
    stop
else (No)
    |API Gateway|
    :(6) Return Error (Ticket already used or invalid);
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | A ticket can only be transitioned to `USED` from `VALID` status. |
| (4) | N/A | The timestamp of usage should be recorded for auditing. |
