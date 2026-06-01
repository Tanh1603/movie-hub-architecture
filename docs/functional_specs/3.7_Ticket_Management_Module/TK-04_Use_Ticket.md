# [TK-04] Use Ticket

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Use Ticket (Mark Entry) |
| **Description** | Marks a ticket as `USED` when the customer enters the cinema hall. This prevents the same ticket from being used twice. |
| **Actor** | Customer |
| **Trigger** | `POST /v1/tickets/:id/use` |
| **Pre-condition** | Ticket exists and caller has owner or cinema validation permission. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## Activities Flow

```plantuml
@startuml
|Customer|
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
      |Customer|
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
actor "Customer" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) POST /v1/tickets/:id/use [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `ticket.use` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Use Ticket (Mark Entry)" function and receives the request/event.<br>❖ The system uses trigger [POST /v1/tickets/:id/use]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [id].<br>❖ Required fields: [id].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Field constraint: [id] is required, type string, path parameter.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Processing Rules:<br>❖ Ticket states are VALID, USED, CANCELLED, and EXPIRED; used tickets cannot be cancelled and invalid tickets cannot be used for entry.<br>❖ Ticket delivery depends on confirmed payment/booking flow and notification/outbox delivery where enabled; lookup must still work from persisted ticket data.<br>❖ Integration uses Booking Service ticket module and, for QR or delivery, notification/outbox/digital delivery components where enabled; microservice pattern ticket.use. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Ticket not found, invalid ticket status during validation/use, and Cannot cancel a used ticket for cancellation.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
