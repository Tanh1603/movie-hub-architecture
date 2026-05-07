# [ST-02] Get Session TTL

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Session TTL |
| **Functional ID** | ST-02 |
| **Description** | Retrieves the remaining time (Time To Live) for the user's current seat-holding session for a showtime. |
| **Actor** | Member |
| **Trigger** | `GET /v1/showtimes/showtime/:showtimeId/ttl` |
| **Pre-condition** | Member has at least one seat held for this showtime. |
| **Post-condition** | Remaining seconds returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Redis" as R

Member -> GW: GET /v1/showtimes/showtime/:id/ttl
GW -> CS: Get TTL Request
CS -> R: TTL hold:user:{userId}:showtime:{id}
alt Key Exists
    R --> CS: Remaining Seconds
    CS --> GW: TTL DTO
    GW --> Member: 200 OK
else No Session
    CS --> GW: 0 seconds / No Session
    GW --> Member: 200 OK (ttl: 0)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request Session Time Remaining;
|API Gateway|
:(2) Forward Request;
|Cinema Service|
:(3) Query Redis for Hold TTL;
|Redis|
:(4) Return TTL value;
if (Session Exists?) then (Yes)
    |API Gateway|
    :(5) Return Remaining Seconds;
else (No)
    |API Gateway|
    :(6) Return 0;
endif
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-SEAT-02 | Seat hold duration (TTL): 10 minutes (600 seconds). |
