# [ST-09] Get Movies at Cinema

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Movies at Cinema |
| **Description** | Lists all movies that currently have scheduled showtimes at a specific cinema location. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/cinemas/cinema/:cinemaId/movies` |
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

Actor -> GW: (1) GET /v1/cinemas/cinema/:cinemaId/movies [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `cinema.movies_by_cinema` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Get Movies at Cinema" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/cinemas/cinema/:cinemaId/movies]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [cinemaId], [page], [limit].<br>❖ The system validates data according to DTO/schema PaginationQuery.<br>❖ Required fields: [cinemaId].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [page], [limit].<br>❖ Field constraint: [cinemaId] is required, type string, path parameter.<br>❖ Field constraint: [page] is optional, type number.<br>❖ Field constraint: [limit] is optional, type number.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ Showtime IDs and filter dates must be parseable; enum fields use FormatEnum and ShowtimeStatusEnum and pagination values are numeric where accepted.<br>❖ Deleting or cancelling showtimes must respect existing bookings/reservations and service constraints.<br>❖ Seat map/TTL reads combine persisted showtime/seat data with Redis held-seat state for the requesting user. |
| (7) | BR4 | Message Rules:<br>❖ Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| (8) | BR5 | Error Handling Rules:<br>❖ Showtime create/update must verify referenced movie release, cinema, and hall and reject overlapping hall schedules with the explicit conflict error returned by Showtime Service.<br>❖ Gateway forwards the request to the target service through microservice pattern cinema.movies_by_cinema and propagates service errors through the common exception layer.<br>❖ Expected failures include Showtime not found, conflict errors such as Conflict with showtime existing in hall, invalid showtime references, and wrong-cinema forbidden messages.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
