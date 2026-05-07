# [RF-05] Process Refund

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Process Refund |
| **Functional ID** | RF-05 |
| **Description** | Marks a refund request as `PROCESSING` while it is being handled by the finance department or gateway. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/refunds/:id/process` |
| **Pre-condition** | Admin authenticated; Refund status is `PENDING`. |
| **Post-condition** | Refund status updated to `PROCESSING`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/refunds/:id/process
GW -> BS: Process Refund Request
BS -> DB: Verify status is PENDING
alt PENDING
    BS -> DB: Update Status = 'PROCESSING'
    DB --> BS: Success
    BS --> GW: 200 OK
else Invalid Status
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Start Processing Refund;
|API Gateway|
:(2) Verify Permissions;
|Booking Service|
:(3) Check if status is PENDING;
if (Is PENDING?) then (Yes)
    |Database|
    :(4) Update status to PROCESSING;
    |API Gateway|
    :(5) Return Success;
    stop
else (No)
    |API Gateway|
    :(6) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | Valid values for `RefundStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`. |
