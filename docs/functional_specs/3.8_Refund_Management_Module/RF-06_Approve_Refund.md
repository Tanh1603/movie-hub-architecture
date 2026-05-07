# [RF-06] Approve Refund

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Approve Refund |
| **Functional ID** | RF-06 |
| **Description** | Formally approves a refund request and updates its status to `COMPLETED`. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/refunds/:id/approve` |
| **Pre-condition** | Admin authenticated; Refund status is `PROCESSING`. |
| **Post-condition** | Refund status set to `COMPLETED`; Payment status updated to `REFUNDED`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/refunds/:id/approve
GW -> BS: Approve Refund Request
BS -> DB: Update Refund SET status = 'COMPLETED'
BS -> DB: Update Payment SET status = 'REFUNDED'
DB --> BS: Success
BS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Approve Refund;
|API Gateway|
:(2) Verify Permissions;
|Booking Service|
:(3) Apply Status Transitions;
|Database|
:(4) Commit Refund = COMPLETED;
:(5) Commit Payment = REFUNDED;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Approval assumes the money has been successfully sent back to the user's account. |
| (5) | N/A | Payment status synchronization is critical for financial reconciliation. |
