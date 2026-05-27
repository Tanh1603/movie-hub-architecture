# [CS-06] Update Inventory

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Inventory |
| **Functional ID** | CS-06 |
| **Description** | Allows an Administrator to update the available stock quantity for a concession item. |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/concessions/:id/inventory` |
| **Pre-condition** | Admin authenticated; Valid numeric quantity provided. |
| **Post-condition** | Stock level updated in database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PATCH /v1/concessions/:id/inventory (newQuantity)
GW -> BS: Update Inventory Request
BS -> DB: Update Quantity SET stock = :quantity WHERE id = :id
DB --> BS: Success
BS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Input New Stock Level;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Validate Quantity >= 0;
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
| (3) | BR198 | When integrated with the booking flow, inventory must be decremented atomically upon booking confirmation to avoid oversell; failures must trigger compensating actions. |
| (3) | BR199 | Stock quantity must never be negative; update requests with negative values must be rejected with HTTP 400. |


