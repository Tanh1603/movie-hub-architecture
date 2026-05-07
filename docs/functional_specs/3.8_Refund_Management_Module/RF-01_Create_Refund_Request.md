# [RF-01] Create Refund Request

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Refund Request |
| **Functional ID** | RF-01 |
| **Description** | Allows a Member to submit a formal request for a refund after cancelling a booking. |
| **Actor** | Member |
| **Trigger** | `POST /v1/refunds` |
| **Pre-condition** | Booking is `CANCELLED`; Payment status is `COMPLETED`; Request made within policy limits. |
| **Post-condition** | Refund record created with status `PENDING`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: POST /v1/refunds (paymentId, reason)
GW -> BS: Create Refund Request
BS -> DB: Verify Payment exists and is COMPLETED
BS -> DB: Verify no existing refund for this payment
alt Eligible
    BS -> BS: Calculate Refund Amount (70% of tickets)
    BS -> DB: Insert Refund Record (Status: PENDING)
    DB --> BS: Success
    BS --> GW: 201 Created
else Ineligible
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request Refund;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Check eligibility (Time, Status);
if (Is Eligible?) then (Yes)
    :(4) Calculate amount (BR-BOOK-06);
    |Database|
    :(5) Save Refund Request (PENDING);
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
| (3) | BR-BOOK-05 | Cancellation must be made at least 2 hours before showtime to be eligible. |
| (4) | BR-BOOK-06 | Refund percentage on ticket cancellation: 70%. |
