# [PY-A03] Cancel Payment

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Cancel Payment |
| **Description** | Allows an Admin to manually mark a PENDING or PROCESSING payment as FAILED/CANCELLED. |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `PUT /v1/payments/admin/:id/cancel` |
| **Pre-condition** | Staff is authenticated with configured payment read/update permission and any filters are valid. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

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

Actor -> GW: (1) PUT /v1/payments/admin/:id/cancel [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `payment.cancel` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Cancel Payment" function and receives the request/event.<br>❖ The system uses trigger [PUT /v1/payments/admin/:id/cancel]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [id].<br>❖ Required fields: [id].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Field constraint: [id] is required, type string, path parameter.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Updating Rules:<br>❖ Payment state transitions are PROCESSING -> PENDING -> COMPLETED/FAILED; COMPLETED, FAILED, and REFUNDED are terminal for normal provider callbacks.<br>❖ Manual payment cancel is allowed only for PENDING payments and transitions the payment to FAILED.<br>❖ Delete/cancel actions must be blocked when dependent records or invalid terminal states would cause data inconsistency. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Payment not found, Booking not found, You do not have access to this booking payments, Booking is not pending payment, Booking payment window has expired, Payment method {method} is not supported, Can only cancel pending payments, and Unable to initiate payment. Please retry later.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
