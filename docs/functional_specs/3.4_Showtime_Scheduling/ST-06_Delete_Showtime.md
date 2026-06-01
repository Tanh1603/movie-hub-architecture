# [ST-06] Delete Showtime

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Showtime |
| **Description** | Removes a scheduled showtime from the system. |
| **Actor** | Authorized Staff |
| **Trigger** | `DELETE /v1/showtimes/showtime/:id` |
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
control "Cinema Service" as SVC
database "Cinema Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) DELETE /v1/showtimes/showtime/:id [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `showtime.delete_showtime` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Delete Showtime" function and receives the request/event.<br>❖ The system uses trigger [DELETE /v1/showtimes/showtime/:id]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [id].<br>❖ Required fields: [id].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Field constraint: [id] is required, type string, path parameter.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Deleting Rules:<br>❖ Showtime IDs and filter dates must be parseable; enum fields use FormatEnum and ShowtimeStatusEnum and pagination values are numeric where accepted.<br>❖ Deleting or cancelling showtimes must respect existing bookings/reservations and service constraints.<br>❖ Seat map/TTL reads combine persisted showtime/seat data with Redis held-seat state for the requesting user.<br>❖ Delete/cancel actions must be blocked when dependent records or invalid terminal states would cause data inconsistency. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Showtime create/update must verify referenced movie release, cinema, and hall and reject overlapping hall schedules with the explicit conflict error returned by Showtime Service.<br>❖ Gateway forwards the request to the target service through microservice pattern showtime.delete_showtime and propagates service errors through the common exception layer.<br>❖ Expected failures include Showtime not found, conflict errors such as Conflict with showtime existing in hall, invalid showtime references, and wrong-cinema forbidden messages.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
