# [RF-07] Reject Refund

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Reject Refund |
| **Functional ID** | RF-07 |
| **Description** | Rejects a refund request (e.g., due to policy violation or invalid data) and updates its status to `FAILED`. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/refunds/:id/reject` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Admin" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "Cinema/User/Notification Services" as EXT

Actor -> GW: PUT /v1/refunds/:id/reject
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `refund.reject`
SVC -> DB: Read/write required records
SVC -> EXT: Fetch showtime/user/payment/ticket context when required
EXT --> SVC: Context or downstream failure
SVC --> GW: ServiceResult or DTO
GW --> Actor: API response or mapped error
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
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
        |Admin|
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
| Gateway guard | BR-RF-07-01 | Request must pass ClerkAuthGuard, RoleGuard where configured, and permission decorators for cinema/global scope before service dispatch. |
| Input validation | BR-RF-07-02 | Refund DTOs require the referenced payment/refund/booking IDs and action-specific reason/provider fields; status filters use RefundStatus values. |
| Route/message boundary | BR-RF-07-03 | Implemented trigger is `PUT /v1/refunds/:id/reject` and service boundary uses `refund.reject`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-RF-07-04 | Refunds can only be created for existing completed payments or confirmed bookings that satisfy refund policy constraints. |
| Business/state rule | BR-RF-07-05 | Refund status transitions are `PENDING -> PROCESSING -> COMPLETED` or `PENDING -> FAILED/REJECTED`; completed/rejected states must not be overwritten by stale actions. |
| Business/state rule | BR-RF-07-06 | Voucher refunds create a fixed-amount promotion voucher for eligible bookings and then update booking/payment/ticket state consistently. |
| Business/state rule | BR-RF-07-07 | Seat release for refunded bookings is delegated to Cinema Service/Redis release flow after refund state is persisted. |
| Integration constraint | BR-RF-07-08 | Integration coordinates Booking, Payment, Ticket, Promotion voucher, Cinema seat release, and uses microservice pattern `refund.reject`. |
| Success response | BR-RF-07-09 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-RF-07-10 | Expected failures include `Payment not found`, `Can only refund completed payments`, `Refund not found`, `Can only process pending refunds`, `Can only reject pending refunds`, `Booking not found`, `Cannot fetch showtime information`, `Showtime information not available`, and `No ticket amount to refund`. |
