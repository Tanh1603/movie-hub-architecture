# [LY-02] Get Transaction History

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Transaction History |
| **Functional ID** | LY-02 |
| **Description** | Retrieves the history of point earnings and redemptions for the member. |
| **Actor** | Member |
| **Trigger** | `GET /v1/loyalty/transactions` |
| **Pre-condition** | Member authenticated. |
| **Post-condition** | List of loyalty transactions returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/loyalty/transactions
GW -> BS: Get Loyalty History Request
BS -> DB: SELECT * FROM LoyaltyTransactions WHERE userId = :id ORDER BY createdAt DESC
DB --> BS: List of Transactions
BS --> GW: Transaction List DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) View Points History;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query Transaction DB;
|Database|
:(4) Return Records;
|API Gateway|
:(5) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | SRS 5.2 | Types: EARN, REDEEM, EXPIRE. |
@enduml
