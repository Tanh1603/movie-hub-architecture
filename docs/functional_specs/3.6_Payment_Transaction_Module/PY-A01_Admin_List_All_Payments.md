# [PY-A01] Admin List All Payments

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Admin List All Payments |
| **Functional ID** | PY-A01 |
| **Description** | Allows Administrators to view a comprehensive list of all payment transactions in the system. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/payments/admin/all` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | Paginated list of all payments returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/payments/admin/all
GW -> GW: Validate Admin Permissions
GW -> BS: Get All Payments Request
BS -> DB: SELECT * FROM Payments ORDER BY createdAt DESC
DB --> BS: List of Payments
BS --> GW: Admin Payment List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Access Payment Management;
|API Gateway|
:(2) Verify Admin Authorization;
|Booking Service|
:(3) Fetch All Payment Records;
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
| (2) | N/A | Access is restricted to Admin role. |
| (3) | N/A | Includes details like Transaction Reference, Gateway Response, and Amount. |
