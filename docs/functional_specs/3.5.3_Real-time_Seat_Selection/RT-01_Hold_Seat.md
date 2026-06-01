# [RT-01] Hold Seat

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Hold Seat |
| **Description** | Allows a member to temporarily lock a seat for 10 minutes while they complete their booking. This is a real-time operation using WebSockets and Redis. |
| **Actor** | Authenticated Socket Client |
| **Trigger** | `Socket.IO event hold_seat` |
| **Pre-condition** | Socket is authenticated with Clerk and joined to the target showtime room when applicable. |
| **Post-condition** | Redis hold state and broadcast events reflect the seat action. |

## Activities Flow

```plantuml
@startuml
|Authenticated Socket Client|
start
:(1) Send request/event [BR1];
|API Gateway|
:(3) Validate authentication, params, query, and body [BR2];
if (Authorized?) then (yes)
  :(3) Validate required input and format [BR2];
  if (Validation passed?) then (yes)
    |Booking Service|
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
      |Authenticated Socket Client|
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
actor "Authenticated Socket Client" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) Socket.IO event hold_seat [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `Socket.IO event hold_seat` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Hold Seat" function and receives the request/event.<br>❖ The system uses trigger [Socket.IO event hold_seat]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Socket connection must pass Clerk WebSocket middleware; unauthenticated clients are disconnected before room join or seat events.<br>❖ SeatActionDto must include showtimeId and seatId; userId is injected from the authenticated socket, not accepted as authoritative client input.<br>❖ Implemented trigger is Socket.IO event hold_seat and service boundary uses gateway.hold_seat -> cinema.seat_held; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Processing Rules:<br>❖ A user may hold at most 8 seats per showtime; exceeding the limit publishes cinema.seat_limit_reached without creating a new hold.<br>❖ Seat holds use Redis keys hold:showtime:{showtimeId}:{seatId} and hold:user:{userId}:showtime:{showtimeId} with a 600-second TTL.<br>❖ If the same user switches showtimes, old held seats are cleared before new holds are accepted.<br>❖ Booking confirmation consumes held seats, removes Redis hold keys, creates seat reservations, and publishes cinema.seat_booked to connected clients.<br>❖ Integration uses Socket.IO plus Redis pub/sub channels gateway.hold_seat, gateway.release_seat, booking.confirmed, cinema.seat_held, cinema.seat_released, cinema.seat_expired, cinema.seat_booked, and cinema.seat_limit_reached. |
| (7) | BR4 | Message Rules:<br>❖ Successful realtime actions publish the matching Redis/socket event; no REST ResponseMessage is produced. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include unauthorized socket disconnect, silently ignored already-held seats, limit reached event, Redis failures, and showtime not found during booking resolution.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
