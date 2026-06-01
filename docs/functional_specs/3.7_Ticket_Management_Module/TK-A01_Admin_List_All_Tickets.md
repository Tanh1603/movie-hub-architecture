# [TK-A01] Admin List All Tickets

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Admin List All Tickets |
| **Description** | Allows Administrators to view a paginated list of all tickets issued in the system. |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `GET /v1/tickets/admin/all` |
| **Pre-condition** | Ticket exists and caller has owner or cinema validation permission. |
| **Post-condition** | Ticket details/QR are returned or ticket state is updated consistently. |

## Activities Flow

```plantuml
@startuml
|Cinema Manager / Staff|
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
      |Cinema Manager / Staff|
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
actor "Cinema Manager / Staff" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) GET /v1/tickets/admin/all [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `ticket.admin.findAll` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Admin List All Tickets" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/tickets/admin/all]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [page], [limit], [bookingId], [showtimeId], [status], [startDate], [endDate].<br>❖ The system validates data according to DTO/schema AdminFindAllTicketsDto.<br>❖ Optional fields: [page], [limit], [bookingId], [showtimeId], [status], [startDate], [endDate].<br>❖ Field constraint: [page] is optional, type number.<br>❖ Field constraint: [limit] is optional, type number.<br>❖ Field constraint: [bookingId] is optional, type string.<br>❖ Field constraint: [showtimeId] is optional, type string.<br>❖ Field constraint: [status] is optional, type TicketStatus.<br>❖ Field constraint: [startDate] is optional, type Date.<br>❖ Field constraint: [endDate] is optional, type Date.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ Ticket states are VALID, USED, CANCELLED, and EXPIRED; used tickets cannot be cancelled and invalid tickets cannot be used for entry.<br>❖ Ticket delivery depends on confirmed payment/booking flow and notification/outbox delivery where enabled; lookup must still work from persisted ticket data.<br>❖ List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data.<br>❖ Integration uses Booking Service ticket module and, for QR or delivery, notification/outbox/digital delivery components where enabled; microservice pattern ticket.admin.findAll. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Ticket not found, invalid ticket status during validation/use, and Cannot cancel a used ticket for cancellation.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
