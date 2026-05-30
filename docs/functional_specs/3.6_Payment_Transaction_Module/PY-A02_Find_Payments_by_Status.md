# [PY-A02] Find Payments by Status

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Find Payments by Status |
| **Functional ID** | PY-A02 |
| **Description** | Allows an Admin to filter the payment list by status (e.g., PENDING, COMPLETED, FAILED). |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `GET /v1/payments/admin/status/:status` |
| **Pre-condition** | Staff is authenticated with configured payment read/update permission and any filters are valid. |
| **Post-condition** | Payment data/statistics are returned or the pending payment is cancelled without invalid state regression. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Cinema Manager / Staff" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB

Actor -> GW: GET /v1/payments/admin/status/:status
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `payment.findByStatus`
SVC -> DB: Read/write required records
SVC --> GW: ServiceResult or DTO
GW --> Actor: API response or mapped error
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Cinema Manager / Staff|
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
        |Cinema Manager / Staff|
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
| Gateway guard | BR-PY-A02-01 | Request must pass ClerkAuthGuard, RoleGuard where configured, and permission decorators for cinema/global scope before service dispatch. |
| Input validation | BR-PY-A02-02 | Path `status` must be a PaymentStatus value: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, or `REFUNDED`; pagination uses numeric `page` and `limit` defaults. |
| Route/message boundary | BR-PY-A02-03 | Implemented trigger is `GET /v1/payments/admin/status/:status` and service boundary uses `payment.findByStatus`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-PY-A02-04 | Payment ownership is checked through the related booking before exposing or mutating payment data for customer routes. |
| Business/state rule | BR-PY-A02-05 | Payment state transitions are `PROCESSING -> PENDING -> COMPLETED/FAILED`; `COMPLETED`, `FAILED`, and `REFUNDED` are terminal for normal provider callbacks. |
| Business/state rule | BR-PY-A02-06 | Read/list/statistics operations must not contact the provider adapter or mutate payment state unless reconciliation code is explicitly invoked. |
| Integration constraint | BR-PY-A02-07 | Integration stays inside Booking Service and Booking Database for this operation; gateway route uses the microservice pattern `payment.findByStatus` and must not re-query the provider unless reconciliation code is explicitly invoked. |
| Success response | BR-PY-A02-08 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-PY-A02-09 | Expected failures include `Payment not found`, `Booking not found`, `You do not have access to this booking payments`, `Booking is not pending payment`, `Booking payment window has expired`, `Payment method {method} is not supported`, `Can only cancel pending payments`, and `Unable to initiate payment. Please retry later.` |
