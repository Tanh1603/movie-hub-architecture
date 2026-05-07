# [TP-02] Update Ticket Pricing

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Ticket Pricing |
| **Functional ID** | TP-02 |
| **Description** | Allows an Admin to update the price for a specific pricing rule (e.g., change the price of a VIP seat on Weekends). |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/ticket-pricings/pricing/:pricingId` |
| **Pre-condition** | Admin authenticated; Pricing ID exists; Valid price value provided. |
| **Post-condition** | Pricing record is updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: PATCH /v1/ticket-pricings/pricing/:id (New Price)
GW -> GW: Validate Admin Role
GW -> CS: Update Pricing Request
CS -> DB: Find Pricing Record
alt Found
    CS -> DB: Update Price SET price = :price
    DB --> CS: Success
    CS --> GW: 200 OK
else Not Found
    CS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Input New Price;
:(2) Submit Update Request;
|API Gateway|
:(3) Validate Authorization;
|Cinema Service|
:(4) Validate Pricing Existence;
if (Exists?) then (Yes)
    :(5) Update Price in DB;
    |Database|
    :(6) Commit Change;
    |API Gateway|
    :(7) Return Success;
    stop
else (No)
    |API Gateway|
    :(8) Return 404 Not Found;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | N/A | Prices must be positive numerical values. |
| (5) | N/A | Changes to pricing do not affect bookings already confirmed, only future ones. |
