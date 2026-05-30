# [ST-10] Get All Movies with Showtimes

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get All Movies with Showtimes |
| **Functional ID** | ST-10 |
| **Description** | Aggregates all movies across the platform that currently have active showtimes, often used for a "Now Showing" landing page. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/cinemas/movies/showtimes` |
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

Actor -> GW: GET /v1/cinemas/movies/showtimes
GW -> GW: Validate public request constraints
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `cinema.all_movies_at_cinemas`
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
| Gateway guard | BR-ST-10-01 | Endpoint is callable without a customer session; any staff context added by the gateway can narrow the returned data. |
| Input validation | BR-ST-10-02 | Showtime IDs and filter dates must be parseable; enum fields use FormatEnum and ShowtimeStatusEnum and pagination values are numeric where accepted. |
| Route/message boundary | BR-ST-10-03 | Implemented trigger is `GET /v1/cinemas/movies/showtimes` and service boundary uses `cinema.all_movies_at_cinemas`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-ST-10-04 | Showtime create/update must verify referenced movie release, cinema, and hall and reject overlapping hall schedules with the explicit conflict error returned by Showtime Service. |
| Business/state rule | BR-ST-10-05 | Managers are limited to their own cinema; gateway overwrites or checks cinemaId from staff context before dispatch. |
| Business/state rule | BR-ST-10-06 | Deleting or cancelling showtimes must respect existing bookings/reservations and service constraints. |
| Business/state rule | BR-ST-10-07 | Seat map/TTL reads combine persisted showtime/seat data with Redis held-seat state for the requesting user. |
| Business/state rule | BR-ST-10-08 | List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| Integration constraint | BR-ST-10-09 | Gateway forwards the request to the target service through microservice pattern `cinema.all_movies_at_cinemas` and propagates service errors through the common exception layer. |
| Success response | BR-ST-10-10 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-ST-10-11 | Expected failures include `Showtime not found`, conflict errors such as `Conflict with showtime existing in hall`, invalid showtime references, and wrong-cinema forbidden messages. |
