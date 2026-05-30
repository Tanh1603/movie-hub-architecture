# [BK-08] Calculate Refund

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Calculate Refund |
| **Functional ID** | BK-08 |
| **Description** | Calculates the potential refund amount for a booking cancellation based on business rules. |
| **Actor** | Member |
| **Trigger** | `GET /v1/bookings/:id/refund-calculation` |
| **Pre-condition** | Booking exists and is CONFIRMED. |
| **Post-condition** | Potential refund amount and breakdown returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/bookings/:id/refund-calculation
GW -> BS: Calculate Refund Request
BS -> DB: Fetch Booking Total
BS -> BS: Apply BR-BOOK-06 (70%)
BS --> GW: Refund Calculation DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request Refund Quote;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Verify Status & Time Constraint;
:(4) Calculate 70% of Ticket Total;
:(5) Determine Concession Refundability;
|API Gateway|
:(6) Return Refund Summary;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | BR148 | Member must own the booking before refund calculation is returned. |
| (3) | BR149 | Refund eligibility must check booking status, showtime start time, and whether the booking was already cancelled/refunded. |
| (3) | BR150 | Current legacy refund calculation requires cancellation at least 2 hours before showtime. |
| (4) | BR151 | Current legacy refund amount is 70% of ticket price only; concessions and service fees are non-refundable. |
| (4) | BR152 | The calculation response must include refund amount, refund percentage, ticket amount, concessions amount, eligibility reason, and deadline when available. |
| (5) | BR153 | Refund policy values must be configurable or isolated so future 24-hour voucher policy changes do not require broad code changes. |


