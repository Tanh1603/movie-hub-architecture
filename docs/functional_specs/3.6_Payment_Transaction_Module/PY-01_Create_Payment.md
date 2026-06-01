# [PY-01] Create Payment

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Payment |
| **Description** | Initiates a payment transaction for a specific booking using a chosen payment gateway (e.g., VNPay). |
| **Actor** | Customer |
| **Trigger** | `POST /v1/payments/bookings/:bookingId` |
| **Pre-condition** | Booking exists, belongs to the customer, remains pending, and is inside the payment window. |
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

Actor -> GW: (1) POST /v1/payments/bookings/:bookingId [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `payment.create` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Create Payment" function and receives the request/event.<br>❖ The system uses trigger [POST /v1/payments/bookings/:bookingId]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [bookingId], [paymentMethod], [amount], [returnUrl], [cancelUrl].<br>❖ The system validates data according to DTO/schema CreatePaymentDto.<br>❖ Required fields: [bookingId].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [paymentMethod], [amount], [returnUrl], [cancelUrl].<br>❖ Field constraint: [bookingId] is required, type string, path parameter.<br>❖ Field constraint: [paymentMethod] is optional, type PaymentMethod.<br>❖ Field constraint: [amount] is optional, type number.<br>❖ Field constraint: [returnUrl] is optional, type string.<br>❖ Field constraint: [cancelUrl] is optional, type string.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Creating Rules:<br>❖ Payment state transitions are PROCESSING -> PENDING -> COMPLETED/FAILED; COMPLETED, FAILED, and REFUNDED are terminal for normal provider callbacks.<br>❖ Payment creation is idempotent for the same booking, method, and amount; reusable PENDING payment URLs are returned until the booking/payment window expires.<br>❖ Only VNPay and ZaloPay adapters are implemented for online redirects; MoMo, Stripe, card, QR, and online banking are extension points until adapters are added.<br>❖ Create actions must reject duplicate/conflicting records before persistence and return the created DTO after persistence. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Expected failures include Payment not found, Booking not found, You do not have access to this booking payments, Booking is not pending payment, Booking payment window has expired, Payment method {method} is not supported, Can only cancel pending payments, and Unable to initiate payment. Please retry later.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
