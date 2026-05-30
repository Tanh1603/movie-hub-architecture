# [RT-02] Release Seat

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Release Seat |
| **Functional ID** | RT-02 |
| **Description** | Allows a member to manually release a seat they previously held. |
| **Actor** | Authenticated Socket Client |
| **Trigger** | `Socket.IO event release_seat` |
| **Pre-condition** | Socket is authenticated with Clerk and joined to the target showtime room when applicable. |
| **Post-condition** | Redis hold state and broadcast events reflect the seat action. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Authenticated Socket Client" as Actor
boundary "API Gateway Socket.IO" as GW
queue "Redis Pub/Sub" as Redis
control "Cinema Realtime Service" as CRS
database "Redis Hold Keys" as Hold

Actor -> GW: Socket.IO event release_seat
GW -> GW: Clerk WS middleware and room context
GW -> Redis: Publish gateway/booking event
Redis -> CRS: Consume event
CRS -> Hold: Read/write hold keys and TTL
CRS -> Redis: Publish cinema seat event
Redis -> GW: Deliver cinema event
GW --> Actor: Broadcast seat update
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Authenticated Socket Client|
start
:Emit seat event with showtimeId and seatId;
|API Gateway Socket.IO|
:Verify Clerk socket user;
if (Authenticated?) then (yes)
  :Inject userId and publish gateway Redis event;
  |Cinema Realtime Service|
  :Validate hold/release request;
  if (Seat action allowed?) then (yes)
    :Update Redis hold keys and TTL;
    :Publish cinema seat event;
    |API Gateway Socket.IO|
    :Broadcast event to showtime room;
    stop
  else (no)
    :Publish limit/error event or ignore duplicate hold;
    stop
  endif
else (no)
  :Disconnect socket;
  stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| Gateway guard | BR-RT-02-01 | Socket connection must pass Clerk WebSocket middleware; unauthenticated clients are disconnected before room join or seat events. |
| Input validation | BR-RT-02-02 | SeatActionDto must include `showtimeId` and `seatId`; `userId` is injected from the authenticated socket, not accepted as authoritative client input. |
| Route/message boundary | BR-RT-02-03 | Implemented trigger is `Socket.IO event release_seat` and service boundary uses `gateway.release_seat -> cinema.seat_released`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-RT-02-04 | A user may hold at most 8 seats per showtime; exceeding the limit publishes `cinema.seat_limit_reached` without creating a new hold. |
| Business/state rule | BR-RT-02-05 | Seat holds use Redis keys `hold:showtime:{showtimeId}:{seatId}` and `hold:user:{userId}:showtime:{showtimeId}` with a 600-second TTL. |
| Business/state rule | BR-RT-02-06 | If the same user switches showtimes, old held seats are cleared before new holds are accepted. |
| Business/state rule | BR-RT-02-07 | Booking confirmation consumes held seats, removes Redis hold keys, creates seat reservations, and publishes `cinema.seat_booked` to connected clients. |
| Integration constraint | BR-RT-02-08 | Integration uses Socket.IO plus Redis pub/sub channels `gateway.hold_seat`, `gateway.release_seat`, `booking.confirmed`, `cinema.seat_held`, `cinema.seat_released`, `cinema.seat_expired`, `cinema.seat_booked`, and `cinema.seat_limit_reached`. |
| Success response | BR-RT-02-09 | Successful realtime actions publish the matching Redis/socket event; no REST `ResponseMessage` is produced. |
| Failure response | BR-RT-02-10 | Expected failures include unauthorized socket disconnect, silently ignored already-held seats, limit reached event, Redis failures, and showtime not found during booking resolution. |
