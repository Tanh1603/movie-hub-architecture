# [BK-04] Get Booking Summary

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Booking Summary |
| **Functional ID** | BK-04 |
| **Description** | Provides a lightweight summary of a booking, typically used for order confirmation screens before final payment. |
| **Actor** | Member |
| **Trigger** | `GET /v1/bookings/:id/summary` |
| **Pre-condition** | Booking exists. |
| **Post-condition** | Summary info returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/bookings/:id/summary
GW -> BS: Get Summary Request
BS -> DB: Fetch Booking Total, Subtotal, Discount
DB --> BS: Data
BS --> GW: Booking Summary DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) View Order Summary;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Fetch summary fields;
|Database|
:(4) Return Record;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Excludes internal technical fields and full QR data. |
