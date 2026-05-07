# [PM-07] Delete Promotion

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Promotion |
| **Functional ID** | PM-07 |
| **Description** | Removes a promotion from the system. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/promotions/:id` |
| **Pre-condition** | Admin authenticated; Promotion ID exists. |
| **Post-condition** | Promotion record removed or soft-deleted. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: DELETE /v1/promotions/:id
GW -> GW: Validate Admin Role
GW -> BS: Delete Request
BS -> DB: Check for existing usage in bookings
alt Safe (No usage)
    BS -> DB: Delete Record
    DB --> BS: Success
    BS --> GW: 200 OK
else Has Usage
    BS -> DB: Update is_active = false (Deactivate)
    BS --> GW: 200 OK (Deactivated)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Promotion Deletion;
|API Gateway|
:(2) Validate Role;
|Booking Service|
:(3) Check for historical usage;
if (Used in past bookings?) then (Yes)
    |Database|
    :(4) Mark as Inactive (is_active = false);
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
| (3) | General | Promotions used in completed bookings should be soft-deleted to maintain audit integrity. |
@enduml
