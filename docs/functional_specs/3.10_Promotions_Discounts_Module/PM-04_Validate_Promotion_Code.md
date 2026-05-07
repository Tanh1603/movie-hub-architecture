# [PM-04] Validate Promotion Code

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Validate Promotion Code |
| **Functional ID** | PM-04 |
| **Description** | Validates a promotion code against a specific booking subtotal to check if it's applicable. |
| **Actor** | Member |
| **Trigger** | `POST /v1/promotions/validate/:code` |
| **Pre-condition** | Member authenticated; Valid payload (subtotal). |
| **Post-condition** | Validation result (Applicable/Not Applicable) and potential discount returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: POST /v1/promotions/validate/:code (subtotal)
GW -> BS: Validate Promo Request
BS -> DB: Find Promotion by Code
alt Found & Active
    BS -> BS: Check BR-PROMO-01: Date Range
    BS -> BS: Check BR-PROMO-03: Min Purchase
    BS -> BS: Check BR-PROMO-02: Usage Limit
    alt All Rules Pass
        BS -> BS: Calculate Discount Amount (BR-PROMO-04/05)
        BS --> GW: 200 OK (Status: VALID, Discount: ...)
    else Rule Violation
        BS --> GW: 200 OK (Status: INVALID, Reason: ...)
    end
else Not Found
    BS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Apply Promo Code in Checkout;
|API Gateway|
:(2) Forward Validation Request;
|Booking Service|
:(3) Check BR-PROMO-01: Date Range;
:(4) Check BR-PROMO-03: Minimum Purchase;
:(5) Check BR-PROMO-02: Usage Limit;
if (All Passed?) then (Yes)
    :(6) Calculate Discount (Type: % or Fixed);
    :(7) Apply BR-PROMO-04: Max Discount Cap;
    |API Gateway|
    :(8) Return Validation Success + Discount;
    stop
else (No)
    |API Gateway|
    :(9) Return Failure Reason;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-PROMO-01 | Promotion must be within valid date range. |
| (5) | BR-PROMO-02 | Promotion usage limit is enforced per promotion. |
| (4) | BR-PROMO-03 | Minimum purchase amount is validated before applying promotion. |
| (7) | BR-PROMO-04 | For PERCENTAGE type promotions, max_discount cap is applied. |
| (6) | BR-PROMO-05 | Discount cannot exceed the subtotal amount. |
@enduml
