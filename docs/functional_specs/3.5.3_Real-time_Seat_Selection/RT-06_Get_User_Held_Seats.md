# [RT-06] Get User Held Seats

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get User Held Seats |
| **Functional ID** | RT-06 |
| **Description** | Retrieves the specific list of seats currently held by the authenticated user for a given showtime. |
| **Actor** | System |
| **Trigger** | Internal Service Call |
| **Pre-condition** | User ID and Showtime ID provided. |
| **Post-condition** | List of seat IDs returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
control "Cinema Service" as CS
entity "Redis" as R

CS -> R: SMEMBERS "hold:user:{uId}:showtime:{id}"
R --> CS: List of seatIds
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Cinema Service|
start
:(1) Fetch user specific holds;
|Redis|
:(2) Query Set by key;
|Cinema Service|
:(3) Return list of seats;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | N/A | Used to highlight which seats are "Yours" vs "Others" on the UI. |
