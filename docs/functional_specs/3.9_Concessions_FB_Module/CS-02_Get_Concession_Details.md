# [CS-02] Get Concession Details

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Concession Details |
| **Functional ID** | CS-02 |
| **Description** | Retrieves full information about a specific concession item, including description, ingredients, and nutritional info (if available). |
| **Actor** | Guest / Authenticated User |
| **Trigger** | `GET /v1/concessions/:id` |
| **Pre-condition** | Required path/query parameters are provided; no customer session is required for this read. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Guest / Authenticated User" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB

Actor -> GW: GET /v1/concessions/:id
GW -> GW: Validate public request constraints
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `concession.findOne`
SVC -> DB: Read/write required records
SVC --> GW: ServiceResult or DTO
GW --> Actor: API response or mapped error
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Guest / Authenticated User|
start
:Send request/event;
|API Gateway|
:Authenticate/authorize when configured;
if (Auth allowed?) then (yes)
  :Validate params/query/body;
  if (Validation passed?) then (yes)
    |Booking Service|
    :Load required records and scope context;
    if (Resource exists and scope is valid?) then (yes)
      :Apply business rules and state checks;
      if (Rules pass?) then (yes)
        :Persist change or build read result;
        if (Downstream integration needed?) then (yes)
          :Call provider/Redis/other service;
          if (Integration succeeds?) then (yes)
            :Return success result;
          else (no)
            :Rollback/mark failed when required;
            |API Gateway|
            :Return mapped downstream failure;
            stop
          endif
        else (no)
          :Return success result;
        endif
        |API Gateway|
        :Wrap/forward response;
        |Guest / Authenticated User|
        :Receive result;
        stop
      else (no)
        |API Gateway|
        :Return conflict or invalid-state error;
        stop
      endif
    else (no)
      |API Gateway|
      :Return not-found or forbidden error;
      stop
    endif
  else (no)
    :Return `ResponseMessage.MSG_1` or `ResponseMessage.MSG_4`;
    stop
  endif
else (no)
  :Return unauthorized/forbidden error;
  stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| Gateway guard | BR-CS-02-01 | Read operation is public unless the gateway method explicitly applies ClerkAuthGuard; staff cinema context may still restrict scoped results when present. |
| Input validation | BR-CS-02-02 | Concession create requires `name`, `category`, and `price`; category must be ConcessionCategory, price/inventory must be numeric, and inventory updates require numeric `quantity`. |
| Route/message boundary | BR-CS-02-03 | Implemented trigger is `GET /v1/concessions/:id` and service boundary uses `concession.findOne`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-CS-02-04 | Concession lookups can filter by cinema, category, and availability; create/update normalizes price and inventory values. |
| Business/state rule | BR-CS-02-05 | Unavailable or out-of-stock concessions cannot be used by booking price calculation. |
| Business/state rule | BR-CS-02-06 | Delete must respect existing order/booking references; service constraint failures map to the propagated service error. |
| Business/state rule | BR-CS-02-07 | Inventory update adjusts the persisted inventory number atomically for the targeted concession. |
| Integration constraint | BR-CS-02-08 | Gateway forwards the request to the target service through microservice pattern `concession.findOne` and propagates service errors through the common exception layer. |
| Success response | BR-CS-02-09 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-CS-02-10 | Expected failures include `Concession not found`, invalid price/inventory format, duplicate name/category constraints, unavailable concession, and relation constraint failures. |
