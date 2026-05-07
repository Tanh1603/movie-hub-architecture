# [UM-02] List Users

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Users |
| **Functional ID** | UM-02 |
| **Description** | Allows Administrators to view a list of all registered users in the system. |
| **Actor** | Admin |
| **Trigger** | `GET /users` |
| **Pre-condition** | Actor is authenticated and has `ADMIN` role. |
| **Post-condition** | List of users is returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: GET /users
GW -> GW: Verify Admin Role
alt Authorized
    GW -> US: Get All Users
    US -> DB: Select * FROM users
    DB --> US: User List
    US --> GW: User List DTO
    GW --> Admin: 200 OK (JSON)
else Unauthorized
    GW --> Admin: 403 Forbidden
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request User List;
|API Gateway|
:(2) Validate Permissions (Admin);
if (Is Admin?) then (Yes)
    |User Service|
    :(3) Query User Database;
    |Database|
    :(4) Return User Records;
    |User Service|
    :(5) Map to DTO;
    |API Gateway|
    :(6) Return Response;
    |Admin|
    :(7) View Users;
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
| (2) | N/A | Access is restricted to Admin role only (SRS Section 6.3). |
