# [CM-04] Delete Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Cinema |
| **Functional ID** | CM-04 |
| **Description** | Soft-deletes or permanently removes a cinema from the system. |
| **Actor** | Authorized Staff |
| **Trigger** | `DELETE /v1/cinemas/cinema/:cinemaId` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Authorized Staff" as Actor
boundary "API Gateway" as GW
control "Cinema Service" as SVC
database "Cinema Database" as DB

Actor -> GW: DELETE /v1/cinemas/cinema/:cinemaId
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `cinema.delete`
SVC -> DB: Read/write required records
SVC --> GW: ServiceResult or DTO
GW --> Actor: API response or mapped error
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Authorized Staff|
start
:Send request/event;
|API Gateway|
:Authenticate/authorize when configured;
if (Auth allowed?) then (yes)
  :Validate params/query/body;
  if (Validation passed?) then (yes)
    |Cinema Service|
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
        |Authorized Staff|
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
| Gateway guard | BR-CM-04-01 | Request must pass ClerkAuthGuard and the configured Permission decorator before the gateway forwards the command. |
| Input validation | BR-CM-04-02 | Cinema IDs and status filters must be valid; status defaults to `ACTIVE` where the controller applies CinemaStatusEnum defaults. |
| Route/message boundary | BR-CM-04-03 | Implemented trigger is `DELETE /v1/cinemas/cinema/:cinemaId` and service boundary uses `cinema.delete`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-CM-04-04 | Cinema-scoped staff can only mutate resources in their own cinema; global create/delete operations reject cinema managers where the gateway checks staff context. |
| Business/state rule | BR-CM-04-05 | Deletes must fail when dependent halls, seats, showtimes, or reservations would violate service constraints. |
| Business/state rule | BR-CM-04-06 | Status filters use the relevant enum and default active status when controller code applies a default. |
| Business/state rule | BR-CM-04-07 | Cinema/Hall/Ticket pricing responses are returned from Cinema Service without exposing internal persistence-only fields. |
| Business/state rule | BR-CM-04-08 | Delete/cancel actions must be blocked when dependent records or invalid terminal states would cause data inconsistency. |
| Integration constraint | BR-CM-04-09 | Gateway forwards the request to the target service through microservice pattern `cinema.delete` and propagates service errors through the common exception layer. |
| Success response | BR-CM-04-10 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-CM-04-11 | Expected failures include resource not found, explicit gateway forbidden messages for wrong cinema scope, `Cannot delete cinema with dependent data`, `Cannot delete hall with dependent data`, and `Seat not found`. |
