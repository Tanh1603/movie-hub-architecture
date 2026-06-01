# [BK-06] Update Booking

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Booking |
| **Description** | Allows updating booking details (e.g., adding concessions or applying a promotion) while in PENDING status. |
| **Actor** | Customer |
| **Trigger** | `PUT /v1/bookings/:id` |
| **Pre-condition** | Customer or staff has access to the booking context; showtime, seat, payment, and refund prerequisites are valid for the requested action. |
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

Actor -> GW: (1) PUT /v1/bookings/:id [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `booking.update` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Update Booking" function and receives the request/event.<br>❖ The system uses trigger [PUT /v1/bookings/:id]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [id], [seats], [seatId], [ticketType], [concessions], [concessionId], [quantity], [promotionCode], [usePoints].<br>❖ The system validates data according to DTO/schema UpdateBookingDto.<br>❖ Required fields: [id], [seatId], [ticketType], [concessionId], [quantity].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [seats], [concessions], [promotionCode], [usePoints].<br>❖ Field constraint: [id] is required, type string, path parameter.<br>❖ Field constraint: [seats] is optional, type Array<{.<br>❖ Field constraint: [seatId] is required, type string.<br>❖ Field constraint: [ticketType] is required, type string.<br>❖ Field constraint: [concessions] is optional, type Array<{.<br>❖ Field constraint: [concessionId] is required, type string.<br>❖ Field constraint: [quantity] is required, type number.<br>❖ Field constraint: [promotionCode] is optional, type string.<br>❖ Field constraint: [usePoints] is optional, type number.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Updating Rules:<br>❖ The system executes the main business operation and returns the requested data or persists the state change consistently.<br>❖ Update actions must merge only allowed DTO fields and leave omitted fields unchanged. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Booking not found, Cannot cancel this booking, Can only update pending bookings, Cannot reschedule cancelled booking, Cannot reschedule completed booking, invalid/expired promotion, loyalty balance errors, and downstream cinema lookup failures.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
