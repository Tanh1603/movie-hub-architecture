# [ST-08] Admin Get Showtimes

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Admin Get Showtimes |
| **Functional ID** | ST-08 |
| **Description** | Provides an administrative view of showtimes for a movie at a cinema, including internal status and capacity info. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/cinemas/:cinemaId/movies/:movieId/showtimes/admin` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | Detailed list of showtimes returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: GET /v1/cinemas/:cId/movies/:mId/showtimes/admin
GW -> GW: Validate Admin Role
GW -> CS: Get Admin Showtimes Request
CS -> DB: SELECT * FROM Showtimes (all statuses)
DB --> CS: Records
CS --> GW: Detailed Showtime List
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Showtime Management View;
|API Gateway|
:(2) Verify Permissions;
|Cinema Service|
:(3) Fetch all showtimes (including Completed/Cancelled);
|Database|
:(4) Return Data;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Unlike public views, this includes `CANCELLED` and `COMPLETED` showtimes for auditing. |
| (3) | N/A | Includes booking counts or seat occupancy percentages. |
