# [PY-03] Get Payments by Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Payments by Booking |
| **Functional ID** | PY-03 |
| **Description** | Lists all payment attempts associated with a specific booking. |
| **Actor** | Member |
| **Trigger** | `GET /v1/payments/booking/:bookingId` |
| **Pre-condition** | Member authenticated; Booking belongs to the member. |
| **Post-condition** | List of payment records returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/payments/booking/:bookingId
GW -> BS: Get Payments for Booking
BS -> DB: SELECT * FROM Payments WHERE bookingId = :id
DB --> BS: List of Payments
BS --> GW: Payment List DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) View Transaction History for Booking;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for Booking ID;
|Database|
:(4) Return List;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Useful for tracking failed attempts and final successful payment. |
| (3) | N/A | Only accessible to the booking owner. |
