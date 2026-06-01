# [PM-04] Validate Promotion Code

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Validate Promotion Code |
| **Description** | Validates a promotion code against a specific booking subtotal to check if it's applicable. |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `POST /v1/promotions/validate/:code` |
| **Pre-condition** | Promotion code and booking amount/context are supplied; customer authentication is optional. |
| **Post-condition** | Validation result is returned without mutating promotion usage counters. |

## Activities Flow

```plantuml
@startuml
|Guest / Authenticated User|
start
:(1) Send request/event [BR1];
|API Gateway|
:(3) Validate authentication, params, query, and body [BR2];
if (Authorized?) then (yes)
  :(3) Validate required input and format [BR2];
  if (Validation passed?) then (yes)
    |Booking Service|
    :(5) Check records, ownership, and state [BR3];
    if (Checks pass?) then (yes)
      :(5) Execute business action or prepare read result [BR3];
      if (Downstream integration needed?) then (yes)
        :(5) Call provider/Redis/related service [BR3];
        if (Integration succeeds?) then (yes)
          :(7) Return success result [BR4];
        else (no)
          :(8) Return integration failure [BR5];
          stop
        endif
      else (no)
        :(7) Return success result [BR4];
      endif
      |API Gateway|
      :(7) Wrap/forward success response [BR4];
      |Guest / Authenticated User|
      :Receive result;
      stop
    else (no)
      |API Gateway|
      :(8) Return not-found, forbidden, conflict, or invalid-state error [BR5];
      stop
    endif
  else (no)
    :(8) Return MSG 1 or MSG 4 [BR2];
    stop
  endif
else (no)
  :(8) Return MSG 2 or MSG 9 [BR5];
  stop
endif
@enduml
```

## Sequence Flow

```plantuml
@startuml
autonumber
actor "Guest / Authenticated User" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) POST /v1/promotions/validate/:code [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `promotion.validate` [BR3]
SVC -> DB: (5) Load records, ownership, and current state [BR3]
SVC -> SVC: (5) Apply business rules and build result [BR3]
SVC -> EXT: (5) Call downstream integration when required [BR3]
EXT --> SVC: Integration result or failure
SVC --> GW: (7)/(8) ServiceResult, DTO, or mapped error [BR4/BR5]
GW --> Actor: API response
@enduml
```

## Business Rules

| Activity | BR Code | Description |
| :--- | :--- | :--- |
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Validate Promotion Code" function and receives the request/event.<br>❖ The system uses trigger [POST /v1/promotions/validate/:code]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [code], [bookingAmount], [userId], [items].<br>❖ The system validates data according to DTO/schema ValidatePromotionDto.<br>❖ Required fields: [code], [bookingAmount].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [userId], [items].<br>❖ Field constraint: [code] is required, type string, path parameter.<br>❖ Field constraint: [bookingAmount] is required, type number.<br>❖ Field constraint: [userId] is optional, type string.<br>❖ Field constraint: [items] is optional, type ValidatePromotionItemDto[], nested fields: type, id, quantity.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Checking Rules:<br>❖ Promotion code uniqueness is enforced; duplicate code creation/update fails with Promotion code already exists.<br>❖ Percentage discounts are capped by configured max discount; fixed amount discounts cannot exceed the eligible purchase amount.<br>❖ Public list defaults to active promotions unless active=false, null, or undefined is explicitly passed. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern promotion.validate and propagates service errors through the common exception layer.<br>❖ Expected failures include Promotion not found, Promotion code already exists, inactive/expired promotion, min-purchase failure, and usage-limit failures.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
