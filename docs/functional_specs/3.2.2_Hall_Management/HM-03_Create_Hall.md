# [HM-03] Create Hall

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Hall |
| **Functional ID** | HM-03 |
| **Description** | Creates a new hall within a cinema, defining its name, type, and total seat capacity. Note: Seat layout is usually generated separately or initialized here. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/halls/hall` |
| **Pre-condition** | Admin authenticated; Valid payload (CinemaId, Name, Type). |
| **Post-condition** | New Hall created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: POST /v1/halls/hall
GW -> GW: Check Admin Role
GW -> CS: Create Hall Request
CS -> DB: Check Name Uniqueness in Cinema
alt Unique
    CS -> DB: Insert Hall
    DB --> CS: New Hall ID
    CS --> GW: 201 Created
else Duplicate Name
    CS --> GW: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Define Hall Details;
:(2) Submit Creation Request;
|API Gateway|
:(3) Validate Permissions;
|Cinema Service|
:(4) Check Duplicate Name in Cinema;
if (Unique?) then (Yes)
    |Database|
    :(5) Insert Record;
    |Cinema Service|
    :(6) Return Success;
    stop
else (No)
    |API Gateway|
    :(7) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | General | Hall names (e.g., "Hall 1") must be unique within a single Cinema. |
