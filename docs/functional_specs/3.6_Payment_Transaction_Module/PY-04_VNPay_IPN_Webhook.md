# [PY-04] VNPay IPN Webhook

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | VNPay IPN Webhook |
| **Description** | An asynchronous callback from VNPay to update the payment and booking status after a transaction is completed by the user. |
| **Actor** | Payment Provider |
| **Trigger** | `GET|POST /v1/payments/:provider/ipn` |
| **Pre-condition** | Provider payload includes the required signed parameters and maps to an existing payment. |
| **Post-condition** | Provider result is acknowledged and payment/booking/ticket state is advanced only when the transition is valid. |

## Activities Flow

```plantuml
@startuml
|Payment Provider|
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
      |Payment Provider|
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
actor "Payment Provider" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) GET|POST /v1/payments/:provider/ipn [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `payment.provider.ipn` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "VNPay IPN Webhook" function and receives the request/event.<br>❖ The system uses trigger [GET|POST /v1/payments/:provider/ipn]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Public integration endpoint; provider/webhook authenticity is verified by signature, IP whitelist, or Clerk webhook envelope instead of a user session.<br>❖ Implemented trigger is GET\|POST /v1/payments/:provider/ipn and service boundary uses payment.provider.ipn; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ Payment ownership is checked through the related booking before exposing or mutating payment data for customer routes.<br>❖ Integration includes signed provider calls/callbacks and Booking Service updates; gateway route uses the microservice pattern payment.provider.ipn.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Creating Rules:<br>❖ Provider names are normalized to PaymentMethod enum values; unknown providers fail with Unsupported payment provider: {provider} and malformed provider payloads are rejected before state mutation.<br>❖ Payment state transitions are PROCESSING -> PENDING -> COMPLETED/FAILED; COMPLETED, FAILED, and REFUNDED are terminal for normal provider callbacks.<br>❖ A callback for a non-pending or stale payment must not regress terminal payment, booking, or ticket state. |
| (7) | BR4 | Message Rules:<br>❖ Successful provider IPN returns the raw provider-compatible acknowledgement payload, e.g. VNPay { RspCode, Message }, instead of the normal API wrapper. |
| (8) | BR5 | Error Handling Rules:<br>❖ Provider callbacks must verify signature and provider reference before applying completion/failure status.<br>❖ Expected failures include Payment not found, Booking not found, You do not have access to this booking payments, Booking is not pending payment, Booking payment window has expired, Payment method {method} is not supported, Can only cancel pending payments, and Unable to initiate payment. Please retry later.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
