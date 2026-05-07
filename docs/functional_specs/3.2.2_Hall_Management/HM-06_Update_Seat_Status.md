# [HM-06] Update Seat Status

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Seat Status |
| **Functional ID** | HM-06 |
| **Description** | Allows modifying the status of a specific seat (e.g., mark as BROKEN or MAINTENANCE) to prevent booking. |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/halls/seat/:seatId/status` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | Seat status updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: PATCH /v1/halls/seat/:id/status
GW -> GW: Check Admin Role
GW -> CS: Update Seat Status
CS -> DB: Update Seat SET status = :status
DB --> CS: Updated Seat
CS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Seat;
:(2) Change Status (Broken/Maintenance);
|API Gateway|
:(3) Validate Role;
|Cinema Service|
:(4) Update Seat;
|Database|
:(5) Save Change;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | If a seat is marked BROKEN, it must be excluded from future booking availability calculations. |
