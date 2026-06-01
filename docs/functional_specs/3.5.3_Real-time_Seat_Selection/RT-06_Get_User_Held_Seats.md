# [RT-06] Get User Held Seats

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Get User Held Seats |
| **Description** | Retrieves the specific list of seats currently held by the authenticated user for a given showtime. |
| **Actor** | Booking Service / API Gateway |
| **Trigger** | `Microservice showtime.get_seats_held_by_user` |
| **Pre-condition** | Trusted service caller supplies showtime/user context for Redis held-seat lookup or cleanup. |
| **Post-condition** | Redis hold keys are returned or cleaned without changing confirmed reservations. |

## Activities Flow

```plantuml
@startuml
|Booking Service / API Gateway|
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
      |Booking Service / API Gateway|
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
actor "Booking Service / API Gateway" as Actor
boundary "API Gateway" as GW
control "Cinema Service" as SVC
database "Cinema Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) Microservice showtime.get_seats_held_by_user [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `Microservice showtime.get_seats_held_by_user` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Get User Held Seats" function and receives the request/event.<br>❖ The system uses trigger [Microservice showtime.get_seats_held_by_user]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Realtime/internal queries run on trusted service paths; upstream customer/staff authentication must already have supplied the authoritative userId and showtimeId context.<br>❖ Held-seat query requires showtimeId; user-specific query also requires the authenticated/upstream userId.<br>❖ Implemented trigger is Microservice showtime.get_seats_held_by_user and service boundary uses showtime.get_seats_held_by_user; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ A user may hold at most 8 seats per showtime; exceeding the limit publishes cinema.seat_limit_reached without creating a new hold.<br>❖ Seat holds use Redis keys hold:showtime:{showtimeId}:{seatId} and hold:user:{userId}:showtime:{showtimeId} with a 600-second TTL.<br>❖ If the same user switches showtimes, old held seats are cleared before new holds are accepted.<br>❖ Booking confirmation consumes held seats, removes Redis hold keys, creates seat reservations, and publishes cinema.seat_booked to connected clients.<br>❖ Integration reads/writes Redis hold keys directly and, for RT-06, exposes the result through Cinema Service message pattern showtime.get_seats_held_by_user. |
| (7) | BR4 | Message Rules:<br>❖ Successful held-seat read returns the Redis holder map or user seat list; no REST ResponseMessage is produced by the realtime service. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include unauthorized socket disconnect, silently ignored already-held seats, limit reached event, Redis failures, and showtime not found during booking resolution.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
