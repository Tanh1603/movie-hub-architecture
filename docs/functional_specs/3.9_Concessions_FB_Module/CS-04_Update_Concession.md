# [CS-04] Update Concession

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Concession |
| **Functional ID** | CS-04 |
| **Description** | Modifies the information of an existing concession item. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/concessions/:id` |
| **Pre-condition** | Admin authenticated; Concession ID exists. |
| **Post-condition** | Concession record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/concessions/:id (Update Data)
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
:(1) Edit Concession Details;
:(2) Submit Update;
|API Gateway|
:(3) Validate Role;
|Booking Service|
:(4) Apply Changes;
|Database|
:(5) Update Record;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Can update price, name, category, or description. |
| (4) | N/A | Price updates only affect future transactions. |
