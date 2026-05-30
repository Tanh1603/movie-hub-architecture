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
| (3) | BR123 | Summary must include checkout-ready movie, cinema, showtime, ticket group, concession, tax, discount, loyalty, and final amount data. |
| (3) | BR124 | If a `PENDING` payment exists for the booking, summary must include its payment method, status, amount, and reusable `paymentUrl`. |
| (3) | BR125 | Summary must exclude internal technical fields, raw webhook metadata, full QR payloads, and sensitive customer data. |
| (3) | BR126 | Pricing in the summary must reflect the latest persisted booking values, not client-side totals. |
| (5) | BR127 | Summary retrieval should be fast enough for checkout resume and should avoid blocking on optional enrichment failures. |


