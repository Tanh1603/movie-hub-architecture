# [RT-03] Confirm Seat Booked

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Confirm Seat Booked |
| **Functional ID** | RT-03 |
| **Description** | Transitions a seat from 'Held' to 'Booked' status in the real-time layout once the booking is confirmed by the system. |
| **Actor** | System |
| **Trigger** | Redis Event `booking.seat_booked` |
| **Pre-condition** | Booking process successfully completed. |
| **Post-condition** | Seat status updated permanently for the duration of the showtime. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
control "Booking Service" as BS
entity "Redis" as R
control "Cinema Service" as CS
boundary "API Gateway (WS)" as WS

BS -> R: Publish "booking.seat_booked" (showtimeId, userId, seats)
R -> CS: Subscribe Event
CS -> R: DEL "hold:showtime:{id}:{seatId}" (Cleanup Redis)
CS -> R: SREM "hold:user:{uId}:showtime:{id}" (Cleanup Redis)
CS -> R: Publish "cinema.seat_booked"
R -> WS: Broadcast to Room
WS -> WS: Mark seats as Booked in memory cache (optional)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Booking Service|
start
:(1) Complete Booking / Payment;
:(2) Publish 'booking.seat_booked' event;
|Cinema Service|
:(3) Catch Event;
|Redis|
:(4) Delete temporary Hold keys;
|Cinema Service|
:(5) Broadcast 'cinema.seat_booked';
|API Gateway|
:(6) Notify all active users for this showtime;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Real-time "Hold" state is temporary. Permanent "Booked" state is derived from Database (Postgres) but broadcasted via WebSocket for UX. |
