# [CF-02] Update Setting

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Setting |
| **Functional ID** | CF-02 |
| **Description** | Allows an Administrator to update the value of a specific system configuration setting. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/config/:key` |
| **Pre-condition** | Admin authenticated; Setting key exists. |
| **Post-condition** | Setting value updated in database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

Admin -> GW: PUT /v1/config/:key (value)
GW -> US: Update Setting Request
US -> DB: Update Setting SET value = :val WHERE key = :key
DB --> US: Success
US --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Edit Setting Value;
:(2) Submit Update;
|API Gateway|
:(3) Validate Authorization;
|User Service|
:(4) Locate Setting Key;
|Database|
:(5) Commit New Value;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | N/A | Changes to critical settings (like VAT) may have immediate system-wide financial impact. |
| (5) | N/A | Values are typically stored as strings and cast by the consuming service. |
@enduml
