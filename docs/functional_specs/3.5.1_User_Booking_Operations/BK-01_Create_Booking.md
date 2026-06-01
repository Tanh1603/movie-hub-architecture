# [BK-01] Create Booking

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Booking |
| **Description** | Initiates a new booking for a specific showtime and set of held seats. |
| **Actor** | Customer |
| **Trigger** | `POST /v1/bookings` |
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

Actor -> GW: (1) POST /v1/bookings [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `booking.create` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Create Booking" function and receives the request/event.<br>❖ The system uses trigger [POST /v1/bookings]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [showtimeId], [seats], [concessions], [promotionCode], [usePoints], [customerInfo].<br>❖ The system validates data according to DTO/schema CreateBookingDto.<br>❖ Required fields: [showtimeId].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [seats], [concessions], [promotionCode], [usePoints], [customerInfo].<br>❖ Field constraint: [showtimeId] is required, type string.<br>❖ Field constraint: [seats] is optional, type SeatBookingDto[], nested fields: seatId, ticketType.<br>❖ Field constraint: [concessions] is optional, type ConcessionItemDto[], nested fields: concessionId, quantity.<br>❖ Field constraint: [promotionCode] is optional, type string.<br>❖ Field constraint: [usePoints] is optional, type number.<br>❖ Field constraint: [customerInfo] is optional, type CustomerInfoDto, nested fields: name, email, phone.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Creating Rules:<br>❖ Booking state transitions are limited to PENDING -> CONFIRMED/CANCELLED/EXPIRED, CONFIRMED -> COMPLETED/CANCELLED/REFUNDED; terminal states do not regress.<br>❖ Seat availability is derived from held Redis seats and persisted seat reservations; duplicate or expired holds must fail without creating inconsistent tickets.<br>❖ Refund/cancellation functions must use the configured cancellation policy, showtime timing, payment status, and refund percentage before changing booking state.<br>❖ Integration may call Cinema Service for showtime/seat context, User Service for customer data, payment/ticket/refund modules for state consistency, and uses microservice pattern booking.create.<br>❖ Create actions must reject duplicate/conflicting records before persistence and return the created DTO after persistence. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Booking not found, Cannot cancel this booking, Can only update pending bookings, Cannot reschedule cancelled booking, Cannot reschedule completed booking, invalid/expired promotion, loyalty balance errors, and downstream cinema lookup failures.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
