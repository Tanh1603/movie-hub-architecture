# [CS-05] Delete Concession

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Concession |
| **Functional ID** | CS-05 |
| **Description** | Removes a concession item from the catalog or marks it as inactive. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/concessions/:id` |
| **Pre-condition** | Admin authenticated; Concession exists. |
| **Post-condition** | Concession removed or status set to INACTIVE. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: DELETE /v1/concessions/:id
GW -> GW: Validate Admin Role
GW -> BS: Delete Request
BS -> DB: Check for existing order associations
alt Safe (No dependencies)
    BS -> DB: Delete Record
    DB --> BS: Success
    BS --> GW: 200 OK
else Has Dependencies
    BS -> DB: Update status = 'INACTIVE'
    BS --> GW: 200 OK (Soft Delete)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Item Removal;
|API Gateway|
:(2) Validate Role;
|Booking Service|
:(3) Check if item was ever ordered;
if (Ordered before?) then (Yes)
    |Database|
    :(4) Mark as INACTIVE (Soft Delete);
else (No)
    |Database|
    :(5) Permanent Delete;
endif
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | Items with transaction history should be soft-deleted to maintain data integrity for reporting. |
