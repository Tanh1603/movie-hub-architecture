# [RF-04] Find Refunds by Payment

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Refunds by Payment |
| **Functional ID** | RF-04 |
| **Description** | Retrieves the refund request(s) associated with a specific payment transaction. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/refunds/payment/:paymentId` |
| **Pre-condition** | Admin authenticated; Payment ID exists. |
| **Post-condition** | List of associated refund records returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/refunds/payment/:id
GW -> BS: Get Refund by Payment Request
BS -> DB: SELECT * FROM Refunds WHERE paymentId = :id
DB --> BS: Refund Record(s)
BS --> GW: Refund List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Check Payment Audit Trail;
|API Gateway|
:(2) Request associated refund;
|Booking Service|
:(3) Query DB for paymentId;
|Database|
:(4) Return Data;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Typically, only one refund is allowed per payment. |
| (3) | N/A | Used to track whether a payment has already been reversed. |
