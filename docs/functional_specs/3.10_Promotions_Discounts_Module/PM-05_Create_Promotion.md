# [PM-05] Create Promotion

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Promotion |
| **Functional ID** | PM-05 |
| **Description** | Allows an Administrator to create a new promotional offer or discount code. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/promotions` |
| **Pre-condition** | Admin authenticated; Valid payload (Code, Type, Value, Dates). |
| **Post-condition** | New promotion record created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: POST /v1/promotions
GW -> GW: Validate Admin Role
GW -> BS: Create Promotion DTO
BS -> DB: Check Code Uniqueness
alt Unique
    BS -> DB: Insert Promotion Record
    DB --> BS: Success
    BS --> GW: 201 Created
else Duplicate Code
    BS --> GW: 409 Conflict
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Define Promo Rules (Type, Amount, Limits);
:(2) Submit Request;
|API Gateway|
:(3) Validate Permissions;
|Booking Service|
:(4) Verify Code Uniqueness;
if (Unique?) then (Yes)
    |Database|
    :(5) Save Promotion;
    |API Gateway|
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
| (1) | SRS 5.1 | Required: Code, PromotionType, DiscountValue, ValidFrom, ValidTo. |
| (1) | SRS 5.2 | PromotionType must be one of: PERCENTAGE, FIXED_AMOUNT, FREE_ITEM, POINTS. |
