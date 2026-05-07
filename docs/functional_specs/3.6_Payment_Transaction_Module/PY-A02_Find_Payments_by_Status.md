# [PY-A02] Find Payments by Status

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Payments by Status |
| **Functional ID** | PY-A02 |
| **Description** | Allows an Admin to filter the payment list by status (e.g., PENDING, COMPLETED, FAILED). |
| **Actor** | Admin |
| **Trigger** | `GET /v1/payments/admin/status/:status` |
| **Pre-condition** | Admin authenticated; Status is a valid `PaymentStatus`. |
| **Post-condition** | List of matching payments returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/payments/admin/status/:status
GW -> BS: Get Payments by Status Request
BS -> DB: SELECT * FROM Payments WHERE status = :status
DB --> BS: List of Payments
BS --> GW: Payment List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Payment Status Filter;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for specific status;
|Database|
:(4) Return matches;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Valid values: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`. |
