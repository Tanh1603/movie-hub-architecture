# [UM-06] Get Staff Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Staff Details |
| **Functional ID** | UM-06 |
| **Description** | Retrieves detailed information about a specific staff member by their unique ID. |
| **Actor** | Admin, Cinema Manager |
| **Trigger** | `GET /v1/staffs/:id` |
| **Pre-condition** | Staff ID exists; User is authenticated with appropriate privileges. |
| **Post-condition** | Detailed staff profile is returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Manager/Admin" as Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: GET /v1/staffs/:id
GW -> GW: Validate Role
GW -> US: Get Staff By ID
US -> DB: Find Unique Staff
alt Found
    DB --> US: Staff Record
    US --> GW: Staff Detail DTO
    GW --> Admin: 200 OK
else Not Found
    DB --> US: null
    US --> GW: Error: Staff Not Found
    GW --> Admin: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Manager/Admin|
start
:(1) Request Staff Details (ID);
|API Gateway|
:(2) Validate Role;
|User Service|
:(3) Query Database for ID;
|Database|
:(4) Retrieve Record;
if (Found?) then (Yes)
    |User Service|
    :(5) Return Details;
    stop
else (No)
    |API Gateway|
    :(6) Return 404 Not Found;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Standard CRUD operation. No complex business logic defined in SRS beyond access control. |
