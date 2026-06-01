# [TP-02] Update Ticket Pricing

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Ticket Pricing |
| **Description** | Allows an Admin to update the price for a specific pricing rule (e.g., change the price of a VIP seat on Weekends). |
| **Actor** | Authorized Staff |
| **Trigger** | `PATCH /v1/ticket-pricing/pricing/:pricingId` |
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
    |Cinema Service|
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
control "Cinema Service" as SVC
database "Cinema Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) PATCH /v1/ticket-pricing/pricing/:pricingId [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `ticket_pricing.update_ticket_pricing` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Update Ticket Pricing" function and receives the request/event.<br>❖ The system uses trigger [PATCH /v1/ticket-pricing/pricing/:pricingId]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Request must pass ClerkAuthGuard and the configured Permission decorator before the gateway forwards the command.<br>❖ Ticket pricing update values must match UpdateTicketPricingSchema; hall/pricing IDs are required and price fields must be numeric.<br>❖ Implemented trigger is PATCH /v1/ticket-pricing/pricing/:pricingId and service boundary uses ticket_pricing.update_ticket_pricing; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ Cinema-scoped staff can only mutate resources in their own cinema; global create/delete operations reject cinema managers where the gateway checks staff context.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Updating Rules:<br>❖ The system executes the main business operation and returns the requested data or persists the state change consistently.<br>❖ Update actions must merge only allowed DTO fields and leave omitted fields unchanged. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern ticket_pricing.update_ticket_pricing and propagates service errors through the common exception layer.<br>❖ Expected failures include validation errors, auth/permission denial, not found, conflict, and downstream service/database failures.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
