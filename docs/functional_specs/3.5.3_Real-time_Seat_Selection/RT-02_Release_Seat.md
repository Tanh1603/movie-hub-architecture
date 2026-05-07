# [RT-02] Release Seat

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Release Seat |
| **Functional ID** | RT-02 |
| **Description** | Allows a member to manually release a seat they previously held. |
| **Actor** | Member |
| **Trigger** | WebSocket Event `gateway.release_seat` |
| **Pre-condition** | Member holds the seat. |
| **Post-condition** | Seat removed from Redis; Event broadcasted as 'Available'. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
participant "Frontend" as FE
boundary "API Gateway (WS)" as WS
control "Cinema Service" as CS
entity "Redis" as R

Member -> FE: Deselect Seat
FE -> WS: Emit "gateway.release_seat" (showtimeId, seatId)
WS -> R: Publish to "release_seat" channel
R -> CS: Subscribe Event
CS -> R: GET "hold:showtime:{id}:{seatId}"
alt Is Owner
    CS -> R: DEL "hold:showtime:{id}:{seatId}"
    CS -> R: SREM "hold:user:{uId}:showtime:{id}" (seatId)
    CS -> R: Publish "cinema.seat_released"
    R -> WS: Broadcast to Room
    WS -> FE: Update UI (Seat Free)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Deselect Seat;
|API Gateway|
:(2) Forward Release Event;
|Cinema Service|
:(3) Verify Ownership;
if (Held by this user?) then (Yes)
    |Redis|
    :(4) Remove Hold Keys;
    |Cinema Service|
    :(5) Broadcast 'cinema.seat_released';
    |API Gateway|
    :(6) Notify other users;
    stop
else (No)
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Users can only release seats they have personally held. |
