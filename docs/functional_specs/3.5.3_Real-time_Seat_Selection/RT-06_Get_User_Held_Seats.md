# [RT-06] Get User Held Seats

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get User Held Seats |
| **Functional ID** | RT-06 |
| **Description** | Retrieves the specific list of seats currently held by the authenticated user for a given showtime. |
| **Actor** | Booking Service / API Gateway |
| **Trigger** | `Microservice showtime.get_seats_held_by_user` |
| **Pre-condition** | Trusted service caller supplies showtime/user context for Redis held-seat lookup or cleanup. |
| **Post-condition** | Redis hold keys are returned or cleaned without changing confirmed reservations. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Booking Service / API Gateway" as Actor
control "Cinema Service" as SVC
database "Redis Hold Keys" as Hold

Actor -> SVC: Microservice showtime.get_seats_held_by_user
SVC -> SVC: Validate trusted showtime/user context
SVC -> Hold: Read hold keys and TTL/member sets
Hold --> SVC: Held seat IDs or holder map
SVC --> Actor: Held-seat result
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Booking Service / API Gateway|
start
:Request held-seat data;
|Cinema Service|
:Validate showtimeId and userId when required;
:Read Redis hold keys/member set;
if (Redis read succeeds?) then (yes)
  :Return held-seat list or holder map;
  stop
else (no)
  :Return mapped Redis/service failure;
  stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| Gateway guard | BR-RT-06-01 | Realtime/internal queries run on trusted service paths; upstream customer/staff authentication must already have supplied the authoritative `userId` and `showtimeId` context. |
| Input validation | BR-RT-06-02 | Held-seat query requires `showtimeId`; user-specific query also requires the authenticated/upstream `userId`. |
| Route/message boundary | BR-RT-06-03 | Implemented trigger is `Microservice showtime.get_seats_held_by_user` and service boundary uses `showtime.get_seats_held_by_user`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-RT-06-04 | A user may hold at most 8 seats per showtime; exceeding the limit publishes `cinema.seat_limit_reached` without creating a new hold. |
| Business/state rule | BR-RT-06-05 | Seat holds use Redis keys `hold:showtime:{showtimeId}:{seatId}` and `hold:user:{userId}:showtime:{showtimeId}` with a 600-second TTL. |
| Business/state rule | BR-RT-06-06 | If the same user switches showtimes, old held seats are cleared before new holds are accepted. |
| Business/state rule | BR-RT-06-07 | Booking confirmation consumes held seats, removes Redis hold keys, creates seat reservations, and publishes `cinema.seat_booked` to connected clients. |
| Integration constraint | BR-RT-06-08 | Integration reads/writes Redis hold keys directly and, for RT-06, exposes the result through Cinema Service message pattern `showtime.get_seats_held_by_user`. |
| Success response | BR-RT-06-09 | Successful held-seat read returns the Redis holder map or user seat list; no REST `ResponseMessage` is produced by the realtime service. |
| Failure response | BR-RT-06-10 | Expected failures include unauthorized socket disconnect, silently ignored already-held seats, limit reached event, Redis failures, and showtime not found during booking resolution. |
