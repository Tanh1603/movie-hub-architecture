# [LY-01] Get Loyalty Balance

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Loyalty Balance |
| **Functional ID** | LY-01 |
| **Description** | Retrieves the current loyalty points balance and membership tier for the authenticated member. |
| **Actor** | Member |
| **Trigger** | `GET /v1/loyalty/balance` |
| **Pre-condition** | Member authenticated. |
| **Post-condition** | Point balance and tier information returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/loyalty/balance
GW -> BS: Get Loyalty Balance Request
BS -> DB: SELECT * FROM LoyaltyAccounts WHERE userId = :id
DB --> BS: Loyalty Record
BS --> GW: Loyalty Balance DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) View My Loyalty Info;
|API Gateway|
:(2) Request Balance;
|Booking Service|
:(3) Query DB for User's Loyalty Account;
|Database|
:(4) Return Points & Tier;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | BR-LOYALTY-04 | New loyalty accounts start at BRONZE tier. |
| (4) | SRS 5.2 | Membership tiers: BRONZE, SILVER, GOLD, PLATINUM. |
@enduml
