# [CF-02] Update Setting

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Setting |
| **Description** | Allows an Administrator to update the value of a specific system configuration setting. |
| **Actor** | Authorized Staff |
| **Trigger** | `PUT /v1/config/:key` |
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

Actor -> GW: (1) PUT /v1/config/:key [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `config.updated` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Update Setting" function and receives the request/event.<br>❖ The system uses trigger [PUT /v1/config/:key]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [key].<br>❖ Required fields: [key].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Field constraint: [key] is required, type string, path parameter.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Updating Rules:<br>❖ Config update requires a key and value; the :key path value and request body must target the same setting key at service level.<br>❖ Config values are stored as typed/JSON values and must remain compatible with consumers that read the same key.<br>❖ Unknown keys or invalid setting values must fail without partially changing other settings.<br>❖ Update actions must merge only allowed DTO fields and leave omitted fields unchanged. |
| (7) | BR4 | Message Rules:<br>❖ Config updates return the persisted setting result and use the shared success message when the service writes data.<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern config.updated and propagates service errors through the common exception layer.<br>❖ Expected failures include missing/invalid config key or value, unauthorized update permission, and service/database write failure.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
