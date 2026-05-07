# [BK-06] Update Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Booking |
| **Functional ID** | BK-06 |
| **Description** | Allows updating booking details (e.g., adding concessions or applying a promotion) while in PENDING status. |
| **Actor** | Member |
| **Trigger** | `PUT /v1/bookings/:id` |
| **Pre-condition** | Booking belongs to Member; Status is PENDING. |
| **Post-condition** | Booking updated; Total price recalculated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: PUT /v1/bookings/:id (Updated Data)
GW -> BS: Update Booking Request
BS -> DB: Verify Status is PENDING
alt PENDING
    BS -> BS: Recalculate Totals
    BS -> DB: Update Record
    DB --> BS: Success
    BS --> GW: 200 OK
else Not PENDING
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Submit Updates (e.g., add Popcorn);
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Verify Status is PENDING;
if (Is PENDING?) then (Yes)
    :(4) Apply Changes;
    :(5) Recalculate Subtotal/Total;
    |Database|
    :(6) Save Changes;
    |API Gateway|
    :(7) Return Updated Summary;
    stop
else (No)
    |API Gateway|
    :(8) Return 400 Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Bookings cannot be modified once they are CONFIRMED or PAID. |
| (5) | BR-PAY-03 | VAT (10%) must be recalculated based on new items. |
