# [UM-05] List Staff

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Staff |
| **Functional ID** | UM-05 |
| **Description** | Allows Admins or Cinema Managers to view a list of staff members, with filtering options for cinema location, position, and employment status. |
| **Actor** | Admin, Cinema Manager |
| **Trigger** | `GET /v1/staffs` |
| **Pre-condition** | User is authenticated with `ADMIN` or `CINEMA_MANAGER` role. |
| **Post-condition** | A filtered list of staff members is returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Manager/Admin" as Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: GET /v1/staffs?cinemaId=...&position=...
GW -> GW: Validate Permissions
GW -> US: Request Staff List (Filters)
US -> DB: Select * FROM Staff WHERE conditions
DB --> US: List of Staff Records
US --> GW: Staff List DTO
GW --> Admin: 200 OK (JSON List)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Manager/Admin|
start
:(1) Request Staff List (provide filters);
|API Gateway|
:(2) Validate Role Permissions;
if (Authorized?) then (Yes)
    |User Service|
    :(3) Parse Query Parameters (cinemaId, position, status);
    :(4) Construct DB Query;
    |Database|
    :(5) Execute Search;
    |User Service|
    :(6) Serialize Results;
    |API Gateway|
    :(7) Return Staff List;
    stop
else (No)
    |API Gateway|
    :(8) Return 403 Forbidden;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | SRS 3.1 | Query Parameters supported: `cinemaId` (Filter by location), `position` (Filter by StaffPosition enum), `status` (ACTIVE/INACTIVE). |
| (4) | SRS 2.3 | Cinema Managers should typically only see staff assigned to their specific cinema (Implicit data scoping rule). |
