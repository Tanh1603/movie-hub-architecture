# [CS-01] List Concessions

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Concessions |
| **Functional ID** | CS-01 |
| **Description** | Retrieves a list of all food and beverage items (concessions) available for purchase. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/concessions` |
| **Pre-condition** | None. |
| **Post-condition** | List of concession items returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

User -> GW: GET /v1/concessions
GW -> BS: Get Concessions Request
BS -> DB: SELECT * FROM Concessions WHERE status = 'ACTIVE'
DB --> BS: List of Concession Records
BS --> GW: Concession List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Browse Concessions Menu;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query Database;
|Database|
:(4) Return Active Records;
|Booking Service|
:(5) Map to Menu DTO;
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | Categorized by `ConcessionCategory` (FOOD, DRINK, COMBO, MERCHANDISE). |
| (4) | N/A | Only items currently in stock or active are displayed to public users. |
