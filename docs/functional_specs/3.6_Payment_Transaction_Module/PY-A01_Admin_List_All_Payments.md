# [PY-A01] Admin List All Payments

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Admin List All Payments |
| **Description** | Allows Administrators to view a comprehensive list of all payment transactions in the system. |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `GET /v1/payments/admin/all` |
| **Pre-condition** | Staff is authenticated with configured payment read/update permission and any filters are valid. |
| **Post-condition** | Payment data/statistics are returned or the pending payment is cancelled without invalid state regression. |

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

Actor -> GW: (1) GET /v1/payments/admin/all [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `payment.admin.findAll` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Admin List All Payments" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/payments/admin/all]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [page], [limit], [sortBy], [sortOrder], [bookingId], [status], [paymentMethod], [startDate], [endDate].<br>❖ The system validates data according to DTO/schema AdminFindAllPaymentsDto.<br>❖ Optional fields: [page], [limit], [sortBy], [sortOrder], [bookingId], [status], [paymentMethod], [startDate], [endDate].<br>❖ Field constraint: [page] is optional, type number.<br>❖ Field constraint: [limit] is optional, type number.<br>❖ Field constraint: [sortBy] is optional, type string.<br>❖ Field constraint: [sortOrder] is optional, type SortOrder.<br>❖ Field constraint: [bookingId] is optional, type string.<br>❖ Field constraint: [status] is optional, type PaymentStatus.<br>❖ Field constraint: [paymentMethod] is optional, type string.<br>❖ Field constraint: [startDate] is optional, type Date.<br>❖ Field constraint: [endDate] is optional, type Date.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ Admin payment filters accept PaymentStatus, payment method, start/end dates, and numeric pagination where supported; invalid enum or date values are rejected by the request layer/service.<br>❖ Payment state transitions are PROCESSING -> PENDING -> COMPLETED/FAILED; COMPLETED, FAILED, and REFUNDED are terminal for normal provider callbacks.<br>❖ Read/list/statistics operations must not contact the provider adapter or mutate payment state unless reconciliation code is explicitly invoked.<br>❖ List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| (7) | BR4 | Message Rules:<br>❖ Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Payment not found, Booking not found, You do not have access to this booking payments, Booking is not pending payment, Booking payment window has expired, Payment method {method} is not supported, Can only cancel pending payments, and Unable to initiate payment. Please retry later.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
