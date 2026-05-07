# [CM-10] Get Available Districts

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Available Districts |
| **Functional ID** | CM-10 |
| **Description** | Returns a list of districts for a specific city where cinemas are located. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/locations/districts` |
| **Pre-condition** | City parameter provided (e.g., `?city=Ho Chi Minh`). |
| **Post-condition** | List of distinct districts returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/locations/districts?city=HCM
GW -> CS: Get Districts for City
CS -> DB: SELECT DISTINCT district FROM Cinemas WHERE city='HCM' AND status='ACTIVE'
DB --> CS: List ["District 1", "Thu Duc", ...]
CS --> GW: District List
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Select City;
:(2) Request Districts;
|API Gateway|
:(3) Pass City Param;
|Cinema Service|
:(4) Query Distinct Districts;
|Database|
:(5) Return Unique Values;
|API Gateway|
:(6) Return List;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Dependent on the selected city. |
