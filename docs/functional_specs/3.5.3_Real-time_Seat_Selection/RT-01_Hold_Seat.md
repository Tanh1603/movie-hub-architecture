# [RT-01] Hold Seat

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Hold Seat |
| **Functional ID** | RT-01 |
| **Description** | Allows a member to temporarily lock a seat for 10 minutes while they complete their booking. This is a real-time operation using WebSockets and Redis. |
| **Actor** | Authenticated Socket Client |
| **Trigger** | `Socket.IO event hold_seat` |
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

Actor -> GW: Socket.IO event hold_seat
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
| Gateway guard | BR-RT-01-01 | Socket connection must pass Clerk WebSocket middleware; unauthenticated clients are disconnected before room join or seat events. |
| Input validation | BR-RT-01-02 | SeatActionDto must include `showtimeId` and `seatId`; `userId` is injected from the authenticated socket, not accepted as authoritative client input. |
| Route/message boundary | BR-RT-01-03 | Implemented trigger is `Socket.IO event hold_seat` and service boundary uses `gateway.hold_seat -> cinema.seat_held`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-RT-01-04 | A user may hold at most 8 seats per showtime; exceeding the limit publishes `cinema.seat_limit_reached` without creating a new hold. |
| Business/state rule | BR-RT-01-05 | Seat holds use Redis keys `hold:showtime:{showtimeId}:{seatId}` and `hold:user:{userId}:showtime:{showtimeId}` with a 600-second TTL. |
| Business/state rule | BR-RT-01-06 | If the same user switches showtimes, old held seats are cleared before new holds are accepted. |
| Business/state rule | BR-RT-01-07 | Booking confirmation consumes held seats, removes Redis hold keys, creates seat reservations, and publishes `cinema.seat_booked` to connected clients. |
| Integration constraint | BR-RT-01-08 | Integration uses Socket.IO plus Redis pub/sub channels `gateway.hold_seat`, `gateway.release_seat`, `booking.confirmed`, `cinema.seat_held`, `cinema.seat_released`, `cinema.seat_expired`, `cinema.seat_booked`, and `cinema.seat_limit_reached`. |
| Success response | BR-RT-01-09 | Successful realtime actions publish the matching Redis/socket event; no REST `ResponseMessage` is produced. |
| Failure response | BR-RT-01-10 | Expected failures include unauthorized socket disconnect, silently ignored already-held seats, limit reached event, Redis failures, and showtime not found during booking resolution. |
