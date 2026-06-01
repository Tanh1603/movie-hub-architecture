# [RF-04] Find Refunds by Payment

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Refunds by Payment |
| **Description** | Retrieves the refund request(s) associated with a specific payment transaction. |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `GET /v1/refunds/payment/:paymentId` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

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

Actor -> GW: (1) GET /v1/refunds/payment/:paymentId [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `refund.findByPayment` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Find Refunds by Payment" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/refunds/payment/:paymentId]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [paymentId].<br>❖ Required fields: [paymentId].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Field constraint: [paymentId] is required, type string, path parameter.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ Refunds can only be created for existing completed payments or confirmed bookings that satisfy refund policy constraints.<br>❖ Refund status transitions are PENDING -> PROCESSING -> COMPLETED or PENDING -> FAILED/REJECTED; completed/rejected states must not be overwritten by stale actions.<br>❖ Voucher refunds create a fixed-amount promotion voucher for eligible bookings and then update booking/payment/ticket state consistently.<br>❖ Seat release for refunded bookings is delegated to Cinema Service/Redis release flow after refund state is persisted.<br>❖ Integration coordinates Booking, Payment, Ticket, Promotion voucher, Cinema seat release, and uses microservice pattern refund.findByPayment. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Payment not found, Can only refund completed payments, Refund not found, Can only process pending refunds, Can only reject pending refunds, Booking not found, Cannot fetch showtime information, Showtime information not available, and No ticket amount to refund.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
