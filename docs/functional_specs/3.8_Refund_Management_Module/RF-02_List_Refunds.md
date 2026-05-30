# [RF-02] List Refunds

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List Refunds |
| **Functional ID** | RF-02 |
| **Description** | Allows Administrators to view a list of all refund requests in the system. |
| **Actor** | Cinema Manager / Staff |
| **Trigger** | `GET /v1/refunds` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Cinema Manager / Staff" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB
control "Cinema/User/Notification Services" as EXT

Actor -> GW: GET /v1/refunds
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `refund.findAll`
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
| Gateway guard | BR-RF-02-01 | Request must pass ClerkAuthGuard, RoleGuard where configured, and permission decorators for cinema/global scope before service dispatch. |
| Input validation | BR-RF-02-02 | Refund DTOs require the referenced payment/refund/booking IDs and action-specific reason/provider fields; status filters use RefundStatus values. |
| Route/message boundary | BR-RF-02-03 | Implemented trigger is `GET /v1/refunds` and service boundary uses `refund.findAll`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-RF-02-04 | Refunds can only be created for existing completed payments or confirmed bookings that satisfy refund policy constraints. |
| Business/state rule | BR-RF-02-05 | Refund status transitions are `PENDING -> PROCESSING -> COMPLETED` or `PENDING -> FAILED/REJECTED`; completed/rejected states must not be overwritten by stale actions. |
| Business/state rule | BR-RF-02-06 | Voucher refunds create a fixed-amount promotion voucher for eligible bookings and then update booking/payment/ticket state consistently. |
| Business/state rule | BR-RF-02-07 | Seat release for refunded bookings is delegated to Cinema Service/Redis release flow after refund state is persisted. |
| Business/state rule | BR-RF-02-08 | List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| Integration constraint | BR-RF-02-09 | Integration coordinates Booking, Payment, Ticket, Promotion voucher, Cinema seat release, and uses microservice pattern `refund.findAll`. |
| Success response | BR-RF-02-10 | Successful write/validation/state-changing operations return service data with `ResponseMessage.MSG_7` where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| Failure response | BR-RF-02-11 | Expected failures include `Payment not found`, `Can only refund completed payments`, `Refund not found`, `Can only process pending refunds`, `Can only reject pending refunds`, `Booking not found`, `Cannot fetch showtime information`, `Showtime information not available`, and `No ticket amount to refund`. |
