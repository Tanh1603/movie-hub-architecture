# [PY-A03] Cancel Payment

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Cancel Payment |
| **Functional ID** | PY-A03 |
| **Description** | Allows an Admin to manually mark a PENDING or PROCESSING payment as FAILED/CANCELLED. |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `PUT /v1/payments/admin/:id/cancel` |
| **Pre-condition** | Staff is authenticated with configured payment read/update permission and any filters are valid. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Cinema Manager / Staff" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB

Actor -> GW: PUT /v1/payments/admin/:id/cancel
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `payment.cancel`
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
| Gateway guard | BR-PY-A03-01 | Request must pass ClerkAuthGuard, RoleGuard where configured, and permission decorators for cinema/global scope before service dispatch. |
| Input validation | BR-PY-A03-02 | Required path IDs (`id`, `bookingId`, or payment ID) must be present; lookup/cancel operations verify the referenced payment or booking before returning data or changing state. |
| Route/message boundary | BR-PY-A03-03 | Implemented trigger is `PUT /v1/payments/admin/:id/cancel` and service boundary uses `payment.cancel`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-PY-A03-04 | Payment ownership is checked through the related booking before exposing or mutating payment data for customer routes. |
| Business/state rule | BR-PY-A03-05 | Payment state transitions are `PROCESSING -> PENDING -> COMPLETED/FAILED`; `COMPLETED`, `FAILED`, and `REFUNDED` are terminal for normal provider callbacks. |
| Business/state rule | BR-PY-A03-06 | Manual payment cancel is allowed only for `PENDING` payments and transitions the payment to `FAILED`. |
| Business/state rule | BR-PY-A03-07 | Delete/cancel actions must be blocked when dependent records or invalid terminal states would cause data inconsistency. |
| Integration constraint | BR-PY-A03-08 | Integration stays inside Booking Service and Booking Database for this operation; gateway route uses the microservice pattern `payment.cancel` and must not re-query the provider unless reconciliation code is explicitly invoked. |
| Success response | BR-PY-A03-09 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-PY-A03-10 | Expected failures include `Payment not found`, `Booking not found`, `You do not have access to this booking payments`, `Booking is not pending payment`, `Booking payment window has expired`, `Payment method {method} is not supported`, `Can only cancel pending payments`, and `Unable to initiate payment. Please retry later.` |
