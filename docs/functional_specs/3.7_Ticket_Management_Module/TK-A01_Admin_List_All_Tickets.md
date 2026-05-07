# [TK-A01] Admin List All Tickets

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Admin List All Tickets |
| **Functional ID** | TK-A01 |
| **Description** | Allows Administrators to view a paginated list of all tickets issued in the system. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/tickets/admin/all` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | List of all tickets returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/tickets/admin/all
GW -> GW: Validate Admin Role
GW -> BS: Get All Tickets Request
BS -> DB: SELECT * FROM Tickets ORDER BY createdAt DESC
DB --> BS: List of Tickets
BS --> GW: Admin Ticket List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Access Ticket Management;
|API Gateway|
:(2) Verify Admin Permissions;
|Booking Service|
:(3) Fetch All Ticket Records;
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
| (3) | N/A | Includes ticket status, seat info, and associated booking ID. |
