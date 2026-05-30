# [CM-10] Get Available Districts

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Available Districts |
| **Functional ID** | CM-10 |
| **Description** | Returns a list of districts for a specific city where cinemas are located. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/cinemas/locations/districts` |
| **Pre-condition** | Required path/query parameters are provided; no customer session is required for this read. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Guest / Authenticated User" as Actor
boundary "API Gateway" as GW
control "Cinema Service" as SVC
database "Cinema Database" as DB

Actor -> GW: GET /v1/cinemas/locations/districts
GW -> GW: Validate public request constraints
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `CINEMA.GET_AVAILABLE_DISTRICTS`
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
| Gateway guard | BR-CM-10-01 | Read operation is public unless the gateway method explicitly applies ClerkAuthGuard; staff cinema context may still restrict scoped results when present. |
| Input validation | BR-CM-10-02 | Required search/filter query values such as `query` or `city` must be non-empty; missing values throw the explicit gateway BadRequest message. |
| Route/message boundary | BR-CM-10-03 | Implemented trigger is `GET /v1/cinemas/locations/districts` and service boundary uses `CINEMA.GET_AVAILABLE_DISTRICTS`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-CM-10-04 | Cinema-scoped staff can only mutate resources in their own cinema; global create/delete operations reject cinema managers where the gateway checks staff context. |
| Business/state rule | BR-CM-10-05 | Deletes must fail when dependent halls, seats, showtimes, or reservations would violate service constraints. |
| Business/state rule | BR-CM-10-06 | Status filters use the relevant enum and default active status when controller code applies a default. |
| Business/state rule | BR-CM-10-07 | Cinema/Hall/Ticket pricing responses are returned from Cinema Service without exposing internal persistence-only fields. |
| Integration constraint | BR-CM-10-08 | Gateway forwards the request to the target service through microservice pattern `CINEMA.GET_AVAILABLE_DISTRICTS` and propagates service errors through the common exception layer. |
| Success response | BR-CM-10-09 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-CM-10-10 | Expected failures include resource not found, explicit gateway forbidden messages for wrong cinema scope, `Cannot delete cinema with dependent data`, `Cannot delete hall with dependent data`, and `Seat not found`. |
