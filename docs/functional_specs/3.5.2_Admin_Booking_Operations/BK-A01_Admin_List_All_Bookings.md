# [BK-A01] Admin List All Bookings

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Admin List All Bookings |
| **Functional ID** | BK-A01 |
| **Description** | Allows Administrators to view a comprehensive list of all bookings across the platform with filtering and sorting capabilities. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/bookings/admin/all` |
| **Pre-condition** | Admin authenticated with proper permissions. |
| **Post-condition** | Paginated list of all bookings returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/bookings/admin/all?status=...&userId=...
GW -> GW: Validate Admin Permissions
GW -> BS: Get All Bookings Request (Filters)
BS -> DB: SELECT * FROM Bookings WHERE ... ORDER BY createdAt DESC
DB --> BS: List of Bookings + Total Count
BS --> GW: Admin Booking List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Access Booking Management;
|API Gateway|
:(2) Verify Admin Authorization;
|Booking Service|
:(3) Parse Query Filters (Status, Date, User);
:(4) Query Booking Database;
|Database|
:(5) Return Records & Count;
|Booking Service|
:(6) Map to Detailed Admin DTO;
|API Gateway|
:(7) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | N/A | Restricted to Admin actor (SRS Section 2.1). |
| (6) | N/A | DTO includes sensitive user info and full transaction history not visible to members. |
