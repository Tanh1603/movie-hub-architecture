# [BK-A05] Confirm Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Confirm Booking |
| **Functional ID** | BK-A05 |
| **Description** | Manually marks a PENDING booking as CONFIRMED, typically used when payment is verified outside the automated system. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/bookings/admin/:id/confirm` |
| **Pre-condition** | Admin authenticated; Booking status is PENDING. |
| **Post-condition** | Booking status set to CONFIRMED; Tickets generated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: POST /v1/bookings/admin/:id/confirm
GW -> BS: Confirm Booking Request
BS -> DB: Verify status is PENDING
alt PENDING
    BS -> DB: Update status = 'CONFIRMED'
    BS -> BS: Generate Tickets & QR Codes
    DB --> BS: Success
    BS --> GW: 200 OK
else Not PENDING
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Manually Confirm Booking;
|API Gateway|
:(2) Verify Permissions;
|Booking Service|
:(3) Check if status is PENDING;
if (Is PENDING?) then (Yes)
    |Database|
    :(4) Update status to CONFIRMED;
    |Booking Service|
    :(5) Invoke Ticket Generation logic;
    |API Gateway|
    :(6) Return Success;
    stop
else (No)
    |API Gateway|
    :(7) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Confirming a booking manually bypasses the payment gateway IPN check. |
| (5) | N/A | Same ticket generation logic as automated flow (Section 3.7). |
