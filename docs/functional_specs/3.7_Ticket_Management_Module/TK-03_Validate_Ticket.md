# [TK-03] Validate Ticket

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Validate Ticket |
| **Functional ID** | TK-03 |
| **Description** | Allows Staff to check the validity of a ticket (e.g., upon scanning QR code) without marking it as used. |
| **Actor** | Staff |
| **Trigger** | `POST /v1/tickets/:id/validate` |
| **Pre-condition** | Staff authenticated; Ticket ID exists. |
| **Post-condition** | Validation result (Valid/Invalid/Expired) returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Staff
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Staff -> GW: POST /v1/tickets/:id/validate
GW -> BS: Validate Ticket Request
BS -> DB: Find Ticket & Showtime Info
alt Found
    BS -> BS: Check Status == VALID
    BS -> BS: Check Current Time < Showtime End
    alt Valid & On Time
        BS --> GW: 200 OK (Status: SUCCESS)
    else Expired / Cancelled
        BS --> GW: 200 OK (Status: FAILED, Reason: ...)
    end
else Not Found
    BS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Staff|
start
:(1) Scan QR Code / Input ID;
|API Gateway|
:(2) Forward Validation Request;
|Booking Service|
:(3) Fetch Ticket & Showtime;
if (Status == VALID?) then (Yes)
    if (Current Time < Showtime End?) then (Yes)
        |API Gateway|
        :(4) Return Success (Ticket is Valid);
    else (No)
        |API Gateway|
        :(5) Return Failure (Ticket Expired);
    endif
else (No)
    |API Gateway|
    :(6) Return Failure (Status: Cancelled/Used);
endif
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Valid states for validation: `VALID`. |
| (3) | General | Tickets cannot be validated after the movie showtime has ended. |
