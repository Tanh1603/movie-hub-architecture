# [UM-05] List Staff

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | List Staff |
| **Description** | Allows Admins or Cinema Managers to view a list of staff members, with filtering options for cinema location, position, and employment status. |
| **Actor** | Authenticated User |
| **Trigger** | `GET /v1/staffs` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## Activities Flow

```plantuml
@startuml
|Authenticated User|
start
:(1) Send request/event [BR1];
|API Gateway|
:(3) Validate authentication, params, query, and body [BR2];
if (Authorized?) then (yes)
  :(3) Validate required input and format [BR2];
  if (Validation passed?) then (yes)
    |User Service|
    :(5) Check records, ownership, and state [BR3];
    if (Checks pass?) then (yes)
      :(5) Execute business action or prepare read result [BR3];
      if (Downstream integration needed?) then (yes)
        :(5) Call provider/Redis/related service [BR3];
        if (Integration succeeds?) then (yes)
          :(7) Return success result [BR4];
        else (no)
          :(8) Return integration failure [BR5];
          stop
        endif
      else (no)
        :(7) Return success result [BR4];
      endif
      |API Gateway|
      :(7) Wrap/forward success response [BR4];
      |Authenticated User|
      :Receive result;
      stop
    else (no)
      |API Gateway|
      :(8) Return not-found, forbidden, conflict, or invalid-state error [BR5];
      stop
    endif
  else (no)
    :(8) Return MSG 1 or MSG 4 [BR2];
    stop
  endif
else (no)
  :(8) Return MSG 2 or MSG 9 [BR5];
  stop
endif
@enduml
```

## Sequence Flow

```plantuml
@startuml
autonumber
actor "Authenticated User" as Actor
boundary "API Gateway" as GW
control "User Service" as SVC
database "User Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) GET /v1/staffs [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `staff.list` [BR3]
SVC -> DB: (5) Load records, ownership, and current state [BR3]
SVC -> SVC: (5) Apply business rules and build result [BR3]
SVC -> EXT: (5) Call downstream integration when required [BR3]
EXT --> SVC: Integration result or failure
SVC --> GW: (7)/(8) ServiceResult, DTO, or mapped error [BR4/BR5]
GW --> Actor: API response
@enduml
```

## Business Rules

| Activity | BR Code | Description |
| :--- | :--- | :--- |
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "List Staff" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/staffs]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [page], [limit], [sortBy], [sortOrder], [cinemaId], [fullName], [gender], [dob], [position], [status], [workType], [shiftType].<br>❖ The system validates data according to DTO/schema StaffQuery.<br>❖ Optional fields: [page], [limit], [sortBy], [sortOrder], [cinemaId], [fullName], [gender], [dob], [position], [status], [workType], [shiftType].<br>❖ Field constraint: [page] is optional, type number.<br>❖ Field constraint: [limit] is optional, type number.<br>❖ Field constraint: [sortBy] is optional, type string.<br>❖ Field constraint: [sortOrder] is optional, type SortOrder.<br>❖ Field constraint: [cinemaId] is optional, type string.<br>❖ Field constraint: [fullName] is optional, type string.<br>❖ Field constraint: [gender] is optional, type Gender.<br>❖ Field constraint: [dob] is optional, type Date.<br>❖ Field constraint: [position] is optional, type StaffPosition.<br>❖ Field constraint: [status] is optional, type StaffStatus.<br>❖ Field constraint: [workType] is optional, type WorkType.<br>❖ Field constraint: [shiftType] is optional, type ShiftType.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ User data is sourced from Clerk-synchronized records and staff context; Clerk webhook payloads must be verified before processing.<br>❖ Staff managers are limited to their assigned cinema for create, view, update, and delete operations where staffContext.cinemaId is present.<br>❖ List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| (7) | BR4 | Message Rules:<br>❖ Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| (8) | BR5 | Error Handling Rules:<br>❖ RBAC and user operations require configured Permission decorators; unknown permissions, unknown roles, and removing the last ADMIN fail with explicit RBAC errors.<br>❖ Staff create/update synchronizes with Clerk where configured and returns propagated errors for duplicate identity or external sync failure.<br>❖ Gateway forwards the request to the target service through microservice pattern staff.list and propagates service errors through the common exception layer.<br>❖ Expected failures include staff cinema-scope ForbiddenException messages, invalid Clerk webhook envelope, unknown permissions/roles, duplicate staff identity, and Cannot remove the last ADMIN.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
