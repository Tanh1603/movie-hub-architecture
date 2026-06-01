# [CM-09] Get Available Cities

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Available Cities |
| **Description** | Returns a list of all unique cities where at least one active cinema exists. Used for populating UI dropdowns. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/cinemas/locations/cities` |
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
    |Cinema Service|
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
control "Cinema Service" as SVC
database "Cinema Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) GET /v1/cinemas/locations/cities [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `CINEMA.GET_AVAILABLE_CITIES` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Get Available Cities" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/cinemas/locations/cities]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Read operation is public unless the gateway method explicitly applies ClerkAuthGuard; staff cinema context may still restrict scoped results when present.<br>❖ Implemented trigger is GET /v1/cinemas/locations/cities and service boundary uses CINEMA.GET_AVAILABLE_CITIES; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ Cinema-scoped staff can only mutate resources in their own cinema; global create/delete operations reject cinema managers where the gateway checks staff context.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ The system executes the main business operation and returns the requested data or persists the state change consistently. |
| (7) | BR4 | Message Rules:<br>❖ Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern CINEMA.GET_AVAILABLE_CITIES and propagates service errors through the common exception layer.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
