# [BK-09] Cancel with Refund

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Cancel with Refund |
| **Functional ID** | BK-09 |
| **Description** | Processes a cancellation and initiates a refund request in one operation. |
| **Actor** | Member |
| **Trigger** | `POST /v1/bookings/:id/cancel-with-refund` |
| **Pre-condition** | Member authenticated; Booking eligible for refund. |
| **Post-condition** | Booking status `CANCELLED`; Refund record created with status `PENDING`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: POST /v1/bookings/:id/cancel-with-refund
GW -> BS: Cancel & Refund Request
BS -> BS: Validate Eligibility (Time/Status)
alt Eligible
    BS -> DB: Update Booking Status = 'CANCELLED'
    BS -> DB: Create Refund Record (Status: PENDING)
    DB --> BS: Success
    BS --> GW: 200 OK
else Not Eligible
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request Cancellation + Refund;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Check Eligibility Rules;
if (Eligible?) then (Yes)
    |Database|
    :(4) Mark Booking as CANCELLED;
    :(5) Create Refund Request Record;
    |Booking Service|
    :(6) Trigger Payment Provider Refund (optional/async);
    |API Gateway|
    :(7) Return Confirmation;
    stop
else (No)
    |API Gateway|
    :(8) Return Error (e.g., Too late for refund);
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-BOOK-05 | Cancellation must be made at least 2 hours before showtime. |
| (3) | BR-BOOK-06 | Refund amount = 70% of ticket price. |
