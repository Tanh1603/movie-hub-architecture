# [CS-06] Update Inventory

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Inventory |
| **Description** | Allows an Administrator to update the available stock quantity for a concession item. |
| **Actor** | Authorized Staff |
| **Trigger** | `PATCH /v1/concessions/:id/inventory` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## Activities Flow

```plantuml
@startuml
|Authorized Staff|
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
      |Authorized Staff|
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
actor "Authorized Staff" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) PATCH /v1/concessions/:id/inventory [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `concession.updateInventory` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Update Inventory" function and receives the request/event.<br>❖ The system uses trigger [PATCH /v1/concessions/:id/inventory]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [quantity], [id].<br>❖ Required fields: [quantity], [id].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Field constraint: [quantity] is required, type number, request body field.<br>❖ Field constraint: [id] is required, type string, path parameter.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Updating Rules:<br>❖ Concession create requires name, category, and price; category must be ConcessionCategory, price/inventory must be numeric, and inventory updates require numeric quantity.<br>❖ Concession lookups can filter by cinema, category, and availability; create/update normalizes price and inventory values.<br>❖ Unavailable or out-of-stock concessions cannot be used by booking price calculation.<br>❖ Inventory update adjusts the persisted inventory number atomically for the targeted concession.<br>❖ Update actions must merge only allowed DTO fields and leave omitted fields unchanged. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Delete must respect existing order/booking references; service constraint failures map to the propagated service error.<br>❖ Gateway forwards the request to the target service through microservice pattern concession.updateInventory and propagates service errors through the common exception layer.<br>❖ Expected failures include Concession not found, invalid price/inventory format, duplicate name/category constraints, unavailable concession, and relation constraint failures.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
