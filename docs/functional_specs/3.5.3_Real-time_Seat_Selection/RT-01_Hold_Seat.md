# [RT-01] Hold Seat

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Hold Seat |
| **Functional ID** | RT-01 |
| **Description** | Allows a member to temporarily lock a seat for 10 minutes while they complete their booking. This is a real-time operation using WebSockets and Redis. |
| **Actor** | Member |
| **Trigger** | WebSocket Event `gateway.hold_seat` |
| **Pre-condition** | Member authenticated; Showtime session active; Seat is currently 'Available'. |
| **Post-condition** | Seat status updated to 'Held' in Redis; Event broadcasted to other users. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
participant "Frontend" as FE
boundary "API Gateway (WS)" as WS
control "Cinema Service" as CS
entity "Redis" as R

Member -> FE: Click Seat
FE -> WS: Emit "gateway.hold_seat" (showtimeId, seatId)
WS -> R: Publish to "hold_seat" channel
R -> CS: Subscribe Event
CS -> R: Check "hold:showtime:{id}:{seatId}" exists?
alt Seat Available
    CS -> R: Check user hold count < 8 (SISMEMBER)
    alt Under Limit
        CS -> R: SET "hold:showtime:{id}:{seatId}" (User ID) EX 600
        CS -> R: SADD "hold:user:{userId}:showtime:{id}" (seatId) EX 600
        CS -> R: Publish "cinema.seat_held"
        R -> WS: Broadcast to Room
        WS -> FE: Update UI (Seat Highlighted)
    else Limit Reached
        CS -> R: Publish "cinema.seat_limit_reached"
        WS -> FE: Show Error (Max 8 seats)
    end
else Seat Taken
    CS -> R: Publish "cinema.seat_already_held"
    WS -> FE: Show Error (Already taken)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
|API Gateway|
|Cinema Service|
|Redis|

|Member|
start
:(1) Select Seat on Layout;
|API Gateway|
:(2) Forward WS Message;
|Cinema Service|
:(3) Verify BR-SEAT-04: Seat not held;
if (Already Held?) then (Yes)
    |API Gateway|
    :(4) Notify Member: Seat Taken;
    stop
else (No)
    |Cinema Service|
    :(5) Verify BR-SEAT-01: Max 8 seats;
    if (Limit Reached?) then (Yes)
        |API Gateway|
        :(6) Notify Member: Limit Reached;
        stop
    else (No)
        |Redis|
        :(7) Set Hold Key with TTL 600s;
        :(8) Add Seat to User Set;
        |Cinema Service|
        :(9) Broadcast 'cinema.seat_held';
        |API Gateway|
        :(10) Update all users in room;
        stop
    endif
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | BR-SEAT-01 | Maximum seats per user per showtime: 8 seats. |
| (7) | BR-SEAT-02 | Seat hold duration (TTL): 10 minutes (600 seconds). |
| (3) | BR-SEAT-04 | A seat cannot be held if it is already held by another user. |
