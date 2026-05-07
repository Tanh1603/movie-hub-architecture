# [PM-08] Toggle Promotion Active

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Toggle Promotion Active |
| **Functional ID** | PM-08 |
| **Description** | Allows an Admin to quickly enable or disable a promotion without deleting it. |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/promotions/:id/toggle-active` |
| **Pre-condition** | Admin authenticated; Promotion ID exists. |
| **Post-condition** | `is_active` status flipped. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PATCH /v1/promotions/:id/toggle-active
GW -> BS: Toggle Active Request
BS -> DB: Update is_active = NOT is_active WHERE id = :id
DB --> BS: Success
BS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Click 'Activate/Deactivate';
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Fetch current status;
:(4) Flip boolean value;
|Database|
:(5) Update Record;
|API Gateway|
:(6) Return New Status;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Deactivated promotions cannot be validated or used in checkout, even if the code is known. |
@enduml
