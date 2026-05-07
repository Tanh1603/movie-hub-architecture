# [RT-04] Clear Old Showtime Session

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Clear Old Showtime Session |
| **Functional ID** | RT-04 |
| **Description** | Automatically releases all held seats from a previous showtime when a user navigates to a new showtime. |
| **Actor** | System |
| **Trigger** | Internal (Detect showtime change in client/gateway) |
| **Pre-condition** | User has held seats for a different showtime. |
| **Post-condition** | Previous showtime's seats released in Redis. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as WS
control "Cinema Service" as CS
entity "Redis" as R

Member -> WS: Switch to new Showtime
WS -> CS: Notify Showtime Change
CS -> R: SMEMBERS "hold:user:{uId}:showtime:{oldId}"
R --> CS: List of Seats
loop for each seat
    CS -> R: DEL "hold:showtime:{oldId}:{seatId}"
    CS -> R: Publish "cinema.seat_released"
end
CS -> R: DEL "hold:user:{uId}:showtime:{oldId}"
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Change Showtime view;
|Cinema Service|
:(2) Identify active holds for previous showtime;
|Redis|
:(3) Fetch seat list for user;
|Cinema Service|
:(4) Release each seat;
|Redis|
:(5) Clean up user-showtime set;
|Cinema Service|
:(6) Broadcast release events;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | BR-SEAT-03 | When a user selects a new showtime, all previously held seats from other showtimes are automatically released. |
