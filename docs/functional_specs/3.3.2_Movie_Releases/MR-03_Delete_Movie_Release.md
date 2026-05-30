# [MR-03] Delete Movie Release

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Movie Release |
| **Functional ID** | MR-03 |
| **Description** | Deletes a movie release entry. |
| **Actor** | Authorized Staff |
| **Trigger** | `DELETE /v1/movie-releases/:id` |
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

Actor -> GW: DELETE /v1/movie-releases/:id
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `movie.release.deleted`
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
| Gateway guard | BR-MR-03-01 | Request must pass ClerkAuthGuard and the configured Permission decorator before the gateway forwards the command. |
| Input validation | BR-MR-03-02 | Movie release create requires UUID `movieId` and `startDate`; `endDate` and `note` are optional, and note is limited to 500 characters. |
| Route/message boundary | BR-MR-03-03 | Implemented trigger is `DELETE /v1/movie-releases/:id` and service boundary uses `movie.release.deleted`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-MR-03-04 | Movie catalog writes require authenticated staff/global permission; public reads only expose catalog/review data intended for clients. |
| Business/state rule | BR-MR-03-05 | Referenced movies, releases, genres, and reviews must exist before update/delete/detail actions; not found paths use ResourceNotFoundException or service errors. |
| Business/state rule | BR-MR-03-06 | Movie release dates, runtime, age rating, language options, and genre references must remain consistent with shared enum/DTO contracts. |
| Business/state rule | BR-MR-03-07 | Review creation/update keeps rating in the allowed range and associates the review with the authenticated/user payload and target movie. |
| Business/state rule | BR-MR-03-08 | Delete/cancel actions must be blocked when dependent records or invalid terminal states would cause data inconsistency. |
| Integration constraint | BR-MR-03-09 | Gateway forwards the request to the target service through microservice pattern `movie.release.deleted` and propagates service errors through the common exception layer. |
| Success response | BR-MR-03-10 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-MR-03-11 | Expected failures include ResourceNotFoundException for missing movie/genre/release/review, validation failures from strict Zod DTOs, and database constraint errors. |
