# [PY-03] Get Payments by Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Payments by Booking |
| **Functional ID** | PY-03 |
| **Description** | Lists all payment attempts associated with a specific booking. |
| **Actor** | Customer |
| **Trigger** | `GET /v1/payments/booking/:bookingId` |
| **Pre-condition** | Payment or booking exists and the customer owns the related booking. |
| **Post-condition** | Payment detail/list is returned without mutating provider or payment state. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Customer" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB

Actor -> GW: GET /v1/payments/booking/:bookingId
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `payment.findByBooking`
SVC -> DB: Read/write required records
SVC --> GW: ServiceResult or DTO
GW --> Actor: API response or mapped error
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Customer|
start
:Send request/event;
|API Gateway|
:Authenticate/authorize when configured;
if (Auth allowed?) then (yes)
  :Validate params/query/body;
  if (Validation passed?) then (yes)
    |Booking Service|
    :Load required records and scope context;
    if (Resource exists and scope is valid?) then (yes)
      :Apply business rules and state checks;
      if (Rules pass?) then (yes)
        :Persist change or build read result;
        if (Downstream integration needed?) then (yes)
          :Call provider/Redis/other service;
          if (Integration succeeds?) then (yes)
            :Return success result;
          else (no)
            :Rollback/mark failed when required;
            |API Gateway|
            :Return mapped downstream failure;
            stop
          endif
        else (no)
          :Return success result;
        endif
        |API Gateway|
        :Wrap/forward response;
        |Customer|
        :Receive result;
        stop
      else (no)
        |API Gateway|
        :Return conflict or invalid-state error;
        stop
      endif
    else (no)
      |API Gateway|
      :Return not-found or forbidden error;
      stop
    endif
  else (no)
    :Return `ResponseMessage.MSG_1` or `ResponseMessage.MSG_4`;
    stop
  endif
else (no)
  :Return unauthorized/forbidden error;
  stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| Gateway guard | BR-PY-03-01 | Customer request must pass ClerkAuthGuard; own-scope permissions and ownership checks prevent access to another user's booking, payment, ticket, loyalty, or refund data. |
| Input validation | BR-PY-03-02 | Required path IDs (`id`, `bookingId`, or payment ID) must be present; lookup/cancel operations verify the referenced payment or booking before returning data or changing state. |
| Route/message boundary | BR-PY-03-03 | Implemented trigger is `GET /v1/payments/booking/:bookingId` and service boundary uses `payment.findByBooking`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-PY-03-04 | Payment ownership is checked through the related booking before exposing or mutating payment data for customer routes. |
| Business/state rule | BR-PY-03-05 | Payment state transitions are `PROCESSING -> PENDING -> COMPLETED/FAILED`; `COMPLETED`, `FAILED`, and `REFUNDED` are terminal for normal provider callbacks. |
| Business/state rule | BR-PY-03-06 | Read/list/statistics operations must not contact the provider adapter or mutate payment state unless reconciliation code is explicitly invoked. |
| Integration constraint | BR-PY-03-07 | Integration stays inside Booking Service and Booking Database for this operation; gateway route uses the microservice pattern `payment.findByBooking` and must not re-query the provider unless reconciliation code is explicitly invoked. |
| Success response | BR-PY-03-08 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-PY-03-09 | Expected failures include `Payment not found`, `Booking not found`, `You do not have access to this booking payments`, `Booking is not pending payment`, `Booking payment window has expired`, `Payment method {method} is not supported`, `Can only cancel pending payments`, and `Unable to initiate payment. Please retry later.` |
