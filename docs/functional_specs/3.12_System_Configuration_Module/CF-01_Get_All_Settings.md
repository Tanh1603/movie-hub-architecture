# [CF-01] Get All Settings

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get All Settings |
| **Functional ID** | CF-01 |
| **Description** | Retrieves all system-wide configuration settings and key-value pairs. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/config` |
| **Pre-condition** | Required path/query parameters are provided; no customer session is required for this read. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Guest / Authenticated User" as Actor
boundary "API Gateway" as GW
control "User Service" as SVC
database "User Database" as DB

Actor -> GW: GET /v1/config
GW -> GW: Validate public request constraints
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `config.list`
SVC -> DB: Read/write required records
SVC --> GW: ServiceResult or DTO
GW --> Actor: API response or mapped error
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Guest / Authenticated User|
start
:Send request/event;
|API Gateway|
:Authenticate/authorize when configured;
if (Auth allowed?) then (yes)
  :Validate params/query/body;
  if (Validation passed?) then (yes)
    |User Service|
    :Load required records and scope context;
    if (Resource exists and scope is valid?) then (yes)
      :Apply business rules and state checks;
      if (Rules pass?) then (yes)
        :Persist change or build read result;
        if (Downstream integration needed?) then (yes)
          :Call provider/Redis/other service;
          if (Integration succeeds?) then (yes)
            :Return success result;
          else (no)
            :Rollback/mark failed when required;
            |API Gateway|
            :Return mapped downstream failure;
            stop
          endif
        else (no)
          :Return success result;
        endif
        |API Gateway|
        :Wrap/forward response;
        |Guest / Authenticated User|
        :Receive result;
        stop
      else (no)
        |API Gateway|
        :Return conflict or invalid-state error;
        stop
      endif
    else (no)
      |API Gateway|
      :Return not-found or forbidden error;
      stop
    endif
  else (no)
    :Return `ResponseMessage.MSG_1` or `ResponseMessage.MSG_4`;
    stop
  endif
else (no)
  :Return unauthorized/forbidden error;
  stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| Gateway guard | BR-CF-01-01 | Endpoint is callable without a customer session; any staff context added by the gateway can narrow the returned data. |
| Input validation | BR-CF-01-02 | Config update requires a `key` and `value`; the `:key` path value and request body must target the same setting key at service level. |
| Route/message boundary | BR-CF-01-03 | Implemented trigger is `GET /v1/config` and service boundary uses `config.list`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-CF-01-04 | Public config list returns settings intended for application configuration; update requires global config update permission. |
| Business/state rule | BR-CF-01-05 | Config values are stored as typed/JSON values and must remain compatible with consumers that read the same key. |
| Business/state rule | BR-CF-01-06 | Unknown keys or invalid setting values must fail without partially changing other settings. |
| Business/state rule | BR-CF-01-07 | Config updates return the persisted setting result and use the shared success message when the service writes data. |
| Business/state rule | BR-CF-01-08 | List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| Integration constraint | BR-CF-01-09 | Gateway forwards the request to the target service through microservice pattern `config.list` and propagates service errors through the common exception layer. |
| Success response | BR-CF-01-10 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-CF-01-11 | Expected failures include missing/invalid config key or value, unauthorized update permission, and service/database write failure. |
