# [LY-04] Redeem Points

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Redeem Points |
| **Functional ID** | LY-04 |
| **Description** | Allows a member to use their accumulated loyalty points to pay for part or all of a booking. |
| **Actor** | Member |
| **Trigger** | `POST /v1/loyalty/redeem` |
| **Pre-condition** | Member has sufficient points; Booking is in PENDING status. |
| **Post-condition** | Points deducted; Booking total reduced; Transaction record created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: POST /v1/loyalty/redeem (bookingId, pointsToRedeem)
GW -> BS: Redeem Request
BS -> DB: Verify current balance >= pointsToRedeem
alt Sufficient Points
    BS -> BS: Calculate Discount (BR-LOYALTY-01)
    BS -> DB: Update LoyaltyAccount SET points = points - redeem
    BS -> DB: Update Booking SET discount = discount + redeemVal
    BS -> DB: Insert LoyaltyTransaction (Type: REDEEM)
    DB --> BS: Success
    BS --> GW: 200 OK
else Insufficient
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Select 'Use Points' in Checkout;
:(2) Input Points to Redeem;
|API Gateway|
:(3) Forward Request;
|Booking Service|
:(4) Check BR-LOYALTY-03: Points balance;
if (Balance >= Redeem?) then (Yes)
    :(5) Calculate Discount (1 point = 1,000 VND);
    |Database|
    :(6) Deduct Points from Account;
    :(7) Apply Discount to Booking;
    :(8) Save REDEEM Transaction;
    |API Gateway|
    :(9) Return New Total;
    stop
else (No)
    |API Gateway|
    :(10) Return Error: Insufficient Points;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | BR-LOYALTY-01 | Point redemption rate: 1 point = 1,000 VND. |
| (4) | BR-LOYALTY-03 | Users cannot redeem more points than their current balance. |
| (7) | N/A | Total discount cannot exceed the booking subtotal. |
@enduml
