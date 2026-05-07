# [BK-A08] Get Booking Statistics

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Booking Statistics |
| **Functional ID** | BK-A08 |
| **Description** | Provides high-level statistics about bookings, such as total count by status, peak booking times, etc. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/bookings/admin/statistics` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | Statistical summary data returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/bookings/admin/statistics
GW -> BS: Get Stats Request
BS -> DB: SELECT status, count(*) FROM Bookings GROUP BY status
DB --> BS: Raw Data
BS -> BS: Aggregate and calculate percentages
BS --> GW: Booking Statistics DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) View Booking Dashboard;
|API Gateway|
:(2) Request Statistics;
|Booking Service|
:(3) Execute Aggregate Queries;
|Database|
:(4) Return Totals;
|Booking Service|
:(5) Format Data for Visualization;
|API Gateway|
:(6) Return Stats JSON;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Statistics help in identifying system performance and booking trends. |
