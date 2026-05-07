# [BK-A03] Find Bookings by Date Range

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Bookings by Date Range |
| **Functional ID** | BK-A03 |
| **Description** | Allows an Admin to filter bookings based on their creation date within a specified range. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/bookings/admin/date-range` |
| **Pre-condition** | Admin authenticated; Valid start and end dates provided. |
| **Post-condition** | List of bookings within the date range returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/bookings/admin/date-range?start=...&end=...
GW -> BS: Get Bookings in Range Request
BS -> DB: SELECT * FROM Bookings WHERE createdAt BETWEEN :start AND :end
DB --> BS: List of Bookings
BS --> GW: Booking List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Specify Date Range;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Parse Date Parameters;
|Database|
:(4) Execute Range Query;
|API Gateway|
:(5) Return Results;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Dates must be in ISO 8601 format or compatible. |
