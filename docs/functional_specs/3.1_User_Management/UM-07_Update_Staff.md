# [UM-07] Update Staff

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Staff |
| **Description** | Updates the information of an existing staff member (e.g., position, status, assignment). |
| **Actor** | Authorized Staff |
| **Trigger** | `PUT /v1/staffs/:id` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## Activities Flow

```plantuml
@startuml
|Authorized Staff|
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
      |Authorized Staff|
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
actor "Authorized Staff" as Actor
boundary "API Gateway" as GW
control "User Service" as SVC
database "User Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) PUT /v1/staffs/:id [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `staff.updated` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Update Staff" function and receives the request/event.<br>❖ The system uses trigger [PUT /v1/staffs/:id]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [id], [cinemaId], [fullName], [email], [phone], [gender], [dob], [position], [status], [workType], [shiftType], [salary], [hireDate].<br>❖ The system validates data according to DTO/schema UpdateStaffRequest.<br>❖ Required fields: [id].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [cinemaId], [fullName], [email], [phone], [gender], [dob], [position], [status], [workType], [shiftType], [salary], [hireDate].<br>❖ Field constraint: [id] is required, type string, path parameter.<br>❖ Field constraint: [cinemaId] is optional, type value, must be a UUID.<br>❖ Field constraint: [fullName] is optional, type string, minimum 1.<br>❖ Field constraint: [email] is optional, type string, must be an email format.<br>❖ Field constraint: [phone] is optional, type string, minimum 9.<br>❖ Field constraint: [gender] is optional, type enum, allowed values: Gender.<br>❖ Field constraint: [dob] is optional, type date, is coerced from request input.<br>❖ Field constraint: [position] is optional, type enum, allowed values: StaffPosition.<br>❖ Field constraint: [status] is optional, type enum, allowed values: StaffStatus.<br>❖ Field constraint: [workType] is optional, type enum, allowed values: WorkType.<br>❖ Field constraint: [shiftType] is optional, type enum, allowed values: ShiftType.<br>❖ Field constraint: [salary] is optional, type number, minimum 0.<br>❖ Field constraint: [hireDate] is optional, type date, is coerced from request input.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Updating Rules:<br>❖ User data is sourced from Clerk-synchronized records and staff context; Clerk webhook payloads must be verified before processing.<br>❖ Staff managers are limited to their assigned cinema for create, view, update, and delete operations where staffContext.cinemaId is present.<br>❖ Update actions must merge only allowed DTO fields and leave omitted fields unchanged. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ RBAC and user operations require configured Permission decorators; unknown permissions, unknown roles, and removing the last ADMIN fail with explicit RBAC errors.<br>❖ Staff create/update synchronizes with Clerk where configured and returns propagated errors for duplicate identity or external sync failure.<br>❖ Gateway forwards the request to the target service through microservice pattern staff.updated and propagates service errors through the common exception layer.<br>❖ Expected failures include staff cinema-scope ForbiddenException messages, invalid Clerk webhook envelope, unknown permissions/roles, duplicate staff identity, and Cannot remove the last ADMIN.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
