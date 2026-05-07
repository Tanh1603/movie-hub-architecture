# [RF-02] List Refunds

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Refunds |
| **Functional ID** | RF-02 |
| **Description** | Allows Administrators to view a list of all refund requests in the system. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/refunds` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | Paginated list of refund requests returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/refunds
GW -> GW: Validate Admin Role
GW -> BS: Get All Refunds Request
BS -> DB: SELECT * FROM Refunds ORDER BY createdAt DESC
DB --> BS: List of Refunds
BS --> GW: Refund List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Access Refund Management;
|API Gateway|
:(2) Verify Admin Authorization;
|Booking Service|
:(3) Fetch All Refund Records;
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
| (2) | N/A | Restricted to Admin users. |
| (3) | N/A | DTO should include booking ID, user name, and requested amount. |
