# [RT-05] Get All Held Seats

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get All Held Seats |
| **Functional ID** | RT-05 |
| **Description** | Internal API call to retrieve all currently held seats for a showtime, typically used during initial layout load. |
| **Actor** | System |
| **Trigger** | Internal Service Call |
| **Pre-condition** | Showtime ID provided. |
| **Post-condition** | Map of seatId -> userId returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
control "Cinema Service" as CS
entity "Redis" as R

CS -> R: SCAN/KEYS "hold:showtime:{id}:*"
R --> CS: List of keys & values
CS -> CS: Map to object { seatId: userId }
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Cinema Service|
start
:(1) Request current hold state;
|Redis|
:(2) Query all keys matching showtime pattern;
:(3) Retrieve associated User IDs;
|Cinema Service|
:(4) Aggregate into Map;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | N/A | Efficient scanning of Redis is required to avoid blocking the main thread. |
