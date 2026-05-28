# [PM-03] Find Promotion by Code

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Promotion by Code |
| **Functional ID** | PM-03 |
| **Description** | Retrieves promotion details using a unique alphanumeric code (e.g., "SUMMER20"). |
| **Actor** | Member |
| **Trigger** | `GET /v1/promotions/code/:code` |
| **Pre-condition** | Member authenticated; Code exists. |
| **Post-condition** | Promotion details returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/promotions/code/:code
GW -> BS: Find Promotion by Code Request
BS -> DB: SELECT * FROM Promotions WHERE code = :code
DB --> BS: Promotion Record
alt Found
    BS --> GW: Promotion DTO
    GW --> Member: 200 OK
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
:(1) Input Promo Code;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query DB for Code;
|Database|
:(4) Return Data;
if (Found?) then (Yes)
    |API Gateway|
    :(5) Return Promotion Details;
    stop
else (No)
    |API Gateway|
    :(6) Return 404 Not Found;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR17 | Promotion code lookup must be case-insensitive; codes differing only by case map to the same promotion. |
| (3) | BR18 | A found promotion must also satisfy validity checks (e.g., active flag and `valid_from/valid_to` range); otherwise it must be treated as not found/expired. |


