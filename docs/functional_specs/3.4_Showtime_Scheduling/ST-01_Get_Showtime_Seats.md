# [ST-01] Get Showtime Seats

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Showtime Seats |
| **Functional ID** | ST-01 |
| **Description** | Retrieves the current seat layout for a specific showtime, including real-time availability and held status for the requesting user. |
| **Actor** | Member |
| **Trigger** | `GET /v1/showtimes/:id/seats` |
| **Pre-condition** | Member is authenticated; Showtime ID exists. |
| **Post-condition** | Returns seat matrix with status (Available, Held, Booked, Broken). |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Redis" as R
entity "Database (Cinema)" as DB

Member -> GW: GET /v1/showtimes/:id/seats
GW -> GW: Validate Auth
GW -> CS: Get Showtime Seats Request
CS -> DB: Find Showtime & Hall Layout
CS -> R: Get Held Seats Map for Showtime
R --> CS: Held Seats Data
CS -> DB: Get Confirmed Reservations
DB --> CS: Booked Seats List
CS -> CS: Merge Status (Layout + Held + Booked)
CS --> GW: Seat Layout DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Select Showtime;
|API Gateway|
:(2) Forward Request;
|Cinema Service|
:(3) Fetch Static Hall Layout;
|Database|
:(4) Query Hall & Seats;
|Cinema Service|
:(5) Fetch Real-time Held Seats;
|Redis|
:(6) Return Held Map;
|Cinema Service|
:(7) Map Final Seat Status;
|API Gateway|
:(8) Return Layout JSON;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | BR-SEAT-04 | A seat cannot be held if it is already held by another user. |
| (7) | SRS 5.2 | Seat types (VIP/Standard) determine the base price displayed on UI. |
