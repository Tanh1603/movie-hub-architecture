# [PM-06] Update Promotion

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Promotion |
| **Functional ID** | PM-06 |
| **Description** | Modifies the terms or details of an existing promotion. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/promotions/:id` |
| **Pre-condition** | Admin authenticated; Promotion ID exists. |
| **Post-condition** | Promotion record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/promotions/:id (Update Data)
GW -> GW: Validate Admin Role
GW -> BS: Update Request
BS -> DB: Find & Update Record
DB --> BS: Success
BS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Edit Promotion Details;
:(2) Submit Update;
|API Gateway|
:(3) Validate Role;
|Booking Service|
:(4) Apply Changes to DB;
|Database|
:(5) Commit Update;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Can update dates, values, and limits. |
| (4) | N/A | Changing the code is generally discouraged but allowed if unique. |
@enduml
