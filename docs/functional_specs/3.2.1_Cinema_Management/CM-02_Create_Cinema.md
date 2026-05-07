# [CM-02] Create Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Cinema |
| **Functional ID** | CM-02 |
| **Description** | Allows an Administrator to register a new cinema location in the system. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/cinemas/cinema` |
| **Pre-condition** | Admin authenticated; Valid payload (Name, Address, City). |
| **Post-condition** | New cinema created in database; Status defaults to ACTIVE or MAINTENANCE. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: POST /v1/cinemas/cinema
GW -> GW: Check Admin Role
GW -> CS: Create Cinema DTO
CS -> DB: Insert New Cinema
DB --> CS: Created Record (ID)
CS --> GW: 201 Created
GW --> Admin: Success Response
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Input Cinema Details;
:(2) Submit Request;
|API Gateway|
:(3) Validate Permissions;
:(4) Validate Payload (Schema);
|Cinema Service|
:(5) Create Database Entry;
|Database|
:(6) Save Record;
|Cinema Service|
:(7) Return New Cinema ID;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | SRS 5.1 | Required fields: Name, Address, City, District. Optional: Description, Image URLs. |
