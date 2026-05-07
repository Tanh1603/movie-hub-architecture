# [PY-A04] Get Payment Statistics

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Payment Statistics |
| **Functional ID** | PY-A04 |
| **Description** | Provides a summary of payment transactions, such as success rate and distribution of payment methods. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/payments/admin/statistics` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | Statistical data returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: GET /v1/payments/admin/statistics
GW -> BS: Get Payment Stats Request
BS -> DB: SELECT status, count(*) FROM Payments GROUP BY status
DB --> BS: Raw Data
BS -> BS: Process totals and percentages
BS --> GW: Payment Stats DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) View Payment Dashboard;
|API Gateway|
:(2) Request Statistics;
|Booking Service|
:(3) Execute Aggregate Queries;
|Database|
:(4) Return Aggregated Results;
|API Gateway|
:(5) Return JSON;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Statistics help monitor gateway stability and user preferences. |
