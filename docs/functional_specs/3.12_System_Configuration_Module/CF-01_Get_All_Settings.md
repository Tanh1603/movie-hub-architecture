# [CF-01] Get All Settings

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Get All Settings |
| **Description** | Retrieves all system-wide configuration settings and key-value pairs. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/config` |
| **Pre-condition** | Required path/query parameters are provided; no customer session is required for this read. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## Activities Flow

```plantuml
@startuml
|Guest / Authenticated User|
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
      |Guest / Authenticated User|
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
actor "Guest / Authenticated User" as Actor
boundary "API Gateway" as GW
control "User Service" as SVC
database "User Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) GET /v1/config [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `config.list` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Get All Settings" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/config]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Endpoint is callable without a customer session; any staff context added by the gateway can narrow the returned data.<br>❖ Implemented trigger is GET /v1/config and service boundary uses config.list; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ Public config list returns settings intended for application configuration; update requires global config update permission.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ Config update requires a key and value; the :key path value and request body must target the same setting key at service level.<br>❖ Config values are stored as typed/JSON values and must remain compatible with consumers that read the same key.<br>❖ Unknown keys or invalid setting values must fail without partially changing other settings.<br>❖ List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| (7) | BR4 | Message Rules:<br>❖ Config updates return the persisted setting result and use the shared success message when the service writes data.<br>❖ Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern config.list and propagates service errors through the common exception layer.<br>❖ Expected failures include missing/invalid config key or value, unauthorized update permission, and service/database write failure.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
