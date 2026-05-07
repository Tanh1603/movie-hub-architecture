# [CM-09] Get Available Cities

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Available Cities |
| **Functional ID** | CM-09 |
| **Description** | Returns a list of all unique cities where at least one active cinema exists. Used for populating UI dropdowns. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/locations/cities` |
| **Pre-condition** | None. |
| **Post-condition** | List of distinct city names returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/locations/cities
GW -> CS: Get Distinct Cities
CS -> DB: SELECT DISTINCT city FROM Cinemas WHERE status='ACTIVE'
DB --> CS: List ["Ho Chi Minh", "Ha Noi", ...]
CS --> GW: City List
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Open Location Selector;
|API Gateway|
:(2) Request Available Cities;
|Cinema Service|
:(3) Query Distinct Cities;
|Database|
:(4) Return Unique Values;
|API Gateway|
:(5) Return List;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Only cities with *active* cinemas should be returned to avoid empty search results. |
