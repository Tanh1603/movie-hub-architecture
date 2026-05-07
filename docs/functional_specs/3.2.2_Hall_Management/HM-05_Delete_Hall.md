# [HM-05] Delete Hall

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Hall |
| **Functional ID** | HM-05 |
| **Description** | Removes a hall from the system. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/halls/hall/:hallId` |
| **Pre-condition** | Admin authenticated; No active showtimes/bookings linked. |
| **Post-condition** | Hall deleted. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: DELETE /v1/halls/hall/:id
GW -> GW: Check Admin Role
GW -> CS: Delete Request
CS -> DB: Check for Future Showtimes
alt No Dependencies
    CS -> DB: Delete Hall
    DB --> CS: Success
    CS --> GW: 200 OK
else Has Dependencies
    CS --> GW: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Deletion;
|API Gateway|
:(2) Validate Role;
|Cinema Service|
:(3) Check Showtimes;
if (Safe?) then (Yes)
    |Database|
    :(4) Delete Record;
    |API Gateway|
    :(5) Return Success;
    stop
else (No)
    |API Gateway|
    :(6) Return 409 Conflict;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | Halls with historical data should be soft-deleted. |
