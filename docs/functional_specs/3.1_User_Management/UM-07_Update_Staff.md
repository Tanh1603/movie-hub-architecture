# [UM-07] Update Staff

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Staff |
| **Functional ID** | UM-07 |
| **Description** | Updates the information of an existing staff member (e.g., position, status, assignment). |
| **Actor** | Admin, Cinema Manager |
| **Trigger** | `PUT /v1/staffs/:id` |
| **Pre-condition** | Staff ID exists; User authorized; Valid update payload. |
| **Post-condition** | Staff record is updated in the database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Manager/Admin" as Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: PUT /v1/staffs/:id (Update Data)
GW -> GW: Validate Role
GW -> US: Update Request
US -> DB: Check Staff Exists
alt Exists
    US -> DB: Update Fields
    DB --> US: Updated Record
    US --> GW: Success Response
    GW --> Admin: 200 OK
else Not Found
    US --> GW: Error 404
    GW --> Admin: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Manager/Admin|
start
:(1) Submit Update Data;
|API Gateway|
:(2) Validate Payload & Role;
|User Service|
:(3) Find Staff Record;
if (Found?) then (Yes)
    :(4) Apply Updates (Position/Status);
    |Database|
    :(5) Commit Changes;
    |API Gateway|
    :(6) Return Updated Profile;
    stop
else (No)
    |API Gateway|
    :(7) Return 404 Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | Updates to `Position` must be valid `StaffPosition` enum values. |
| (4) | SRS 5.2 | Updates to `Status` must be valid `StaffStatus` (ACTIVE/INACTIVE). |
