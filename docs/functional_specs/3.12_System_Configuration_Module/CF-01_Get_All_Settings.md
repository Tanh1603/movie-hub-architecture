# [CF-01] Get All Settings

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get All Settings |
| **Functional ID** | CF-01 |
| **Description** | Retrieves all system-wide configuration settings and key-value pairs. |
| **Actor** | Admin |
| **Trigger** | `GET /v1/config` |
| **Pre-condition** | Admin authenticated. |
| **Post-condition** | List of all settings returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: GET /v1/config
GW -> GW: Validate Admin Permissions
GW -> US: Get All Settings Request
US -> DB: SELECT * FROM Settings
DB --> US: List of Settings
US --> GW: Config List DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Access System Settings;
|API Gateway|
:(2) Verify Admin Authorization;
|User Service|
:(3) Query Settings Table;
|Database|
:(4) Return All Key-Value Pairs;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (2) | N/A | Settings include things like VAT rate, cancellation deadlines, etc. (SRS 5.1). |
| (2) | N/A | Only accessible to the Admin actor. |
@enduml
