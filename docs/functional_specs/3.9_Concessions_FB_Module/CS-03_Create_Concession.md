# [CS-03] Create Concession

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Concession |
| **Functional ID** | CS-03 |
| **Description** | Allows an Administrator to add a new food or beverage item to the catalog. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/concessions` |
| **Pre-condition** | Admin authenticated; Valid payload (Name, Price, Category). |
| **Post-condition** | New concession record created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: POST /v1/concessions
GW -> GW: Validate Admin Role
GW -> BS: Create Concession DTO
BS -> DB: Insert Record
DB --> BS: Created Record (ID)
BS --> GW: 201 Created
GW --> Admin: Success Response
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Enter Item Details;
:(2) Submit Request;
|API Gateway|
:(3) Validate Permissions;
|Booking Service|
:(4) Save Record to DB;
|Database|
:(5) Commit Transaction;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | SRS 5.1 | Required: Name, Price, Category. Optional: Description, Image URL. |
| (1) | SRS 5.2 | Category must be a valid `ConcessionCategory` enum member. |
