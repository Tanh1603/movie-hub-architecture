# [CM-08] Filter Cinemas

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Filter Cinemas |
| **Functional ID** | CM-08 |
| **Description** | Allows detailed filtering of cinemas by multiple criteria such as City, District, or Brand (if applicable). |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/filters` |
| **Pre-condition** | Filter parameters provided. |
| **Post-condition** | Filtered list returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/filters?city=HCM&district=Q1
GW -> CS: Filter Request
CS -> DB: SELECT * FROM Cinemas WHERE city=... AND district=...
DB --> CS: Filtered Records
CS --> GW: Result List
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Apply Filters (City, District);
|API Gateway|
:(2) Route Request;
|Cinema Service|
:(3) Build Dynamic Query;
|Database|
:(4) Execute Query;
|API Gateway|
:(5) Return Results;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | SRS 3.2.1 | Supports City and District filtering primarily. |
