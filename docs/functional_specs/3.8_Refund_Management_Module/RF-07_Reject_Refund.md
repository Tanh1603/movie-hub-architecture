# [RF-07] Reject Refund

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Reject Refund |
| **Functional ID** | RF-07 |
| **Description** | Rejects a refund request (e.g., due to policy violation or invalid data) and updates its status to `FAILED`. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/refunds/:id/reject` |
| **Pre-condition** | Admin authenticated; Reason for rejection provided. |
| **Post-condition** | Refund status set to `FAILED`; Rejection reason logged. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/refunds/:id/reject (reason)
GW -> BS: Reject Refund Request
BS -> DB: Update Refund SET status = 'FAILED', notes = :reason
DB --> BS: Success
BS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Refund to Reject;
:(2) Input Rejection Reason;
|API Gateway|
:(3) Verify Authorization;
|Database|
:(4) Mark Refund as FAILED;
:(5) Store Rejection Reason;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | N/A | A reason must be provided for all rejected refunds to maintain audit quality. |
