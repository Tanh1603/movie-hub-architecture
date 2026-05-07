# [LY-03] Earn Points

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Earn Points |
| **Functional ID** | LY-03 |
| **Description** | Automatically adds loyalty points to the user's account after a successful booking confirmation. |
| **Actor** | Member, System |
| **Trigger** | `POST /v1/loyalty/earn` (or internal event) |
| **Pre-condition** | Booking confirmed and paid. |
| **Post-condition** | Points balance increased; Transaction record created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
participant "Booking Flow" as Flow
control "Booking Service" as BS
entity "Database (Booking)" as DB

Flow -> BS: Confirm Booking Success
BS -> BS: Calculate Points (BR-LOYALTY-02)
BS -> DB: Update Points in LoyaltyAccount
BS -> DB: Insert LoyaltyTransaction (Type: EARN)
DB --> BS: Success
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Booking Service|
start
:(1) Detect Successful Payment;
:(2) Identify User's Loyalty Account;
:(3) Calculate Points (1 point per 1,000 VND spent);
|Database|
:(4) Increment Points Balance;
:(5) Save EARN Transaction;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-LOYALTY-02 | Point earning rate: 1 point per 1,000 VND spent. |
| (4) | N/A | Total spend used for calculation is typically the subtotal after discounts. |
@enduml
