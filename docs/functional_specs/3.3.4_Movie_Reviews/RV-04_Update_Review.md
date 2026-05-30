# [RV-04] Update Review

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Review |
| **Functional ID** | RV-04 |
| **Description** | Allows a Member to modify their own review and rating for a movie. |
| **Actor** | Authorized Staff |
| **Trigger** | `PUT /v1/movies/:id/reviews/:reviewId` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Authorized Staff" as Actor
boundary "API Gateway" as GW
control "Movie Service" as SVC
database "Movie Database" as DB

Actor -> GW: PUT /v1/movies/:id/reviews/:reviewId
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `movie.review.updated`
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
    |Movie Service|
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
| Gateway guard | BR-RV-04-01 | Request must pass ClerkAuthGuard and the configured Permission decorator before the gateway forwards the command. |
| Input validation | BR-RV-04-02 | Review create requires UUID `movieId`, `userId`, integer `rating` from 1 to 5, and `content`; update follows the review update DTO. |
| Route/message boundary | BR-RV-04-03 | Implemented trigger is `PUT /v1/movies/:id/reviews/:reviewId` and service boundary uses `movie.review.updated`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-RV-04-04 | Movie catalog writes require authenticated staff/global permission; public reads only expose catalog/review data intended for clients. |
| Business/state rule | BR-RV-04-05 | Referenced movies, releases, genres, and reviews must exist before update/delete/detail actions; not found paths use ResourceNotFoundException or service errors. |
| Business/state rule | BR-RV-04-06 | Movie release dates, runtime, age rating, language options, and genre references must remain consistent with shared enum/DTO contracts. |
| Business/state rule | BR-RV-04-07 | Review creation/update keeps rating in the allowed range and associates the review with the authenticated/user payload and target movie. |
| Business/state rule | BR-RV-04-08 | Update actions must merge only allowed DTO fields and leave omitted fields unchanged. |
| Integration constraint | BR-RV-04-09 | Gateway forwards the request to the target service through microservice pattern `movie.review.updated` and propagates service errors through the common exception layer. |
| Success response | BR-RV-04-10 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-RV-04-11 | Expected failures include ResourceNotFoundException for missing movie/genre/release/review, validation failures from strict Zod DTOs, and database constraint errors. |
