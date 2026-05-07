# [HM-04] Update Hall

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Hall |
| **Functional ID** | HM-04 |
| **Description** | Updates hall details such as name, type (IMAX, standard), or operational status. |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/halls/hall/:hallId` |
| **Pre-condition** | Admin authenticated; Hall exists. |
| **Post-condition** | Hall record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: PATCH /v1/halls/hall/:hallId
GW -> GW: Check Admin Role
GW -> CS: Update Request
CS -> DB: Update Hall Fields
DB --> CS: Updated Record
CS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Submit Updates;
|API Gateway|
:(2) Validate Role;
|Cinema Service|
:(3) Apply Changes;
|Database|
:(4) Update Record;
|API Gateway|
:(5) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Status changes (e.g., to MAINTENANCE) must be handled carefully if future showtimes exist (Manual process implied). |
