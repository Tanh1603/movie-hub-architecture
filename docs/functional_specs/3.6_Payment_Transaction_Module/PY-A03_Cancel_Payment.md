# [PY-A03] Cancel Payment

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Cancel Payment |
| **Functional ID** | PY-A03 |
| **Description** | Allows an Admin to manually mark a PENDING or PROCESSING payment as FAILED/CANCELLED. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/payments/admin/:id/cancel` |
| **Pre-condition** | Admin authenticated; Payment exists. |
| **Post-condition** | Payment status updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/payments/admin/:id/cancel
GW -> BS: Cancel Payment Request
BS -> DB: Update Payment SET status = 'FAILED' WHERE id = :id
DB --> BS: Success
BS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Payment Cancellation;
|API Gateway|
:(2) Validate Authorization;
|Booking Service|
:(3) Update Record to FAILED;
|Database|
:(4) Commit Change;
|API Gateway|
:(5) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Does not trigger a refund at the gateway; only updates internal status. |
