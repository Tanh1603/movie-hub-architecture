# [BK-07] Reschedule Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Reschedule Booking |
| **Functional ID** | BK-07 |
| **Description** | Allows a Member to change the showtime of an existing CONFIRMED booking, subject to limits and time constraints. |
| **Actor** | Customer |
| **Trigger** | `POST /v1/bookings/:id/reschedule` |
| **Pre-condition** | Customer or staff has access to the booking context; showtime, seat, payment, and refund prerequisites are valid for the requested action. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Customer" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "Cinema/User/Notification Services" as EXT

Actor -> GW: POST /v1/bookings/:id/reschedule
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `booking.reschedule`
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
| Gateway guard | BR-BK-07-01 | Customer request must pass ClerkAuthGuard; own-scope permissions and ownership checks prevent access to another user's booking, payment, ticket, loyalty, or refund data. |
| Input validation | BR-BK-07-02 | Path and query IDs must identify existing bookings/showtimes; status filters use BookingStatus and PaymentStatus enums, and pagination/date query values must be parseable before service dispatch. |
| Route/message boundary | BR-BK-07-03 | Implemented trigger is `POST /v1/bookings/:id/reschedule` and service boundary uses `booking.reschedule`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-BK-07-04 | Booking ownership is enforced for customer endpoints; admin endpoints are scoped by cinema context when the authenticated staff account has a cinema assignment. |
| Business/state rule | BR-BK-07-05 | Booking state transitions are limited to `PENDING -> CONFIRMED/CANCELLED/EXPIRED`, `CONFIRMED -> COMPLETED/CANCELLED/REFUNDED`; terminal states do not regress. |
| Business/state rule | BR-BK-07-06 | Seat availability is derived from held Redis seats and persisted seat reservations; duplicate or expired holds must fail without creating inconsistent tickets. |
| Business/state rule | BR-BK-07-07 | Refund/cancellation functions must use the configured cancellation policy, showtime timing, payment status, and refund percentage before changing booking state. |
| Integration constraint | BR-BK-07-08 | Integration may call Cinema Service for showtime/seat context, User Service for customer data, payment/ticket/refund modules for state consistency, and uses microservice pattern `booking.reschedule`. |
| Success response | BR-BK-07-09 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-BK-07-10 | Expected failures include `Booking not found`, `Cannot cancel this booking`, `Can only update pending bookings`, `Cannot reschedule cancelled booking`, `Cannot reschedule completed booking`, invalid/expired promotion, loyalty balance errors, and downstream cinema lookup failures. |
