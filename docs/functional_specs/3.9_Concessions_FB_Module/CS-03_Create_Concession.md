# [CS-03] Create Concession

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Concession |
| **Description** | Allows an Administrator to add a new food or beverage item to the catalog. |
| **Actor** | Authorized Staff |
| **Trigger** | `POST /v1/concessions` |
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

Actor -> GW: (1) POST /v1/concessions [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `concession.create` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Create Concession" function and receives the request/event.<br>❖ The system uses trigger [POST /v1/concessions]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [name], [nameEn], [description], [category], [price], [imageUrl], [available], [inventory], [cinemaId], [nutritionInfo], [allergens].<br>❖ The system validates data according to DTO/schema CreateConcessionDto.<br>❖ Required fields: [name], [category], [price].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [nameEn], [description], [imageUrl], [available], [inventory], [cinemaId], [nutritionInfo], [allergens].<br>❖ Field constraint: [name] is required, type string.<br>❖ Field constraint: [nameEn] is optional, type string.<br>❖ Field constraint: [description] is optional, type string.<br>❖ Field constraint: [category] is required, type ConcessionCategory.<br>❖ Field constraint: [price] is required, type number.<br>❖ Field constraint: [imageUrl] is optional, type string.<br>❖ Field constraint: [available] is optional, type boolean.<br>❖ Field constraint: [inventory] is optional, type number.<br>❖ Field constraint: [cinemaId] is optional, type string.<br>❖ Field constraint: [nutritionInfo] is optional, type Record<string, any>.<br>❖ Field constraint: [allergens] is optional, type string[].<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Creating Rules:<br>❖ Concession create requires name, category, and price; category must be ConcessionCategory, price/inventory must be numeric, and inventory updates require numeric quantity.<br>❖ Concession lookups can filter by cinema, category, and availability; create/update normalizes price and inventory values.<br>❖ Unavailable or out-of-stock concessions cannot be used by booking price calculation.<br>❖ Inventory update adjusts the persisted inventory number atomically for the targeted concession.<br>❖ Create actions must reject duplicate/conflicting records before persistence and return the created DTO after persistence. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Delete must respect existing order/booking references; service constraint failures map to the propagated service error.<br>❖ Gateway forwards the request to the target service through microservice pattern concession.create and propagates service errors through the common exception layer.<br>❖ Expected failures include Concession not found, invalid price/inventory format, duplicate name/category constraints, unavailable concession, and relation constraint failures.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
