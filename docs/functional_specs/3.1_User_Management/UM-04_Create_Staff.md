# [UM-04] Create Staff

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Staff |
| **Functional ID** | UM-04 |
| **Description** | Allows Admins or Cinema Managers to create a new staff account with a specific position and assignment. |
| **Actor** | Admin, Cinema Manager |
| **Trigger** | `POST /v1/staffs` |
| **Pre-condition** | Admin/Manager logged in; Valid payload (email, position). |
| **Post-condition** | New Staff record created in DB. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Manager/Admin" as Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: POST /v1/staffs
GW -> GW: Verify Permissions (Admin/Manager)
GW -> US: Create Staff DTO
US -> DB: Check Email Uniqueness
alt Email Unique
    US -> DB: Insert Staff Record
    DB --> US: Created Staff
    US --> GW: 201 Created
    GW --> Admin: Success Response
else Email Exists
    US --> GW: Error: Email already in use
    GW --> Admin: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin/Manager|
start
:(1) Input Staff Details (Email, Position, Cinema);
:(2) Submit Request;
|API Gateway|
:(3) Validate Auth & Role;
:(4) Validate Payload (Enum: Position);
|User Service|
:(5) Check Duplicate Email;
if (Unique?) then (Yes)
    |Database|
    :(6) Create Staff Record;
    |User Service|
    :(7) Return New Staff Object;
    stop
else (No)
    |API Gateway|
    :(8) Return 409 Conflict;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 2.2 | Position must be one of: `TICKET_CLERK`, `CONCESSION_STAFF`, `USHER`, `PROJECTIONIST`, `CLEANER`, `SECURITY`, etc. |
| (6) | SRS 5.1 | Staff record links to User account (via Clerk ID possibly) or stands alone as internal record. |
