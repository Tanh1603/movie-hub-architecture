# [LY-02] Get Transaction History

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Transaction History |
| **Functional ID** | LY-02 |
| **Description** | Retrieves the history of point earnings and redemptions for the member. |
| **Actor** | Customer |
| **Trigger** | `GET /v1/loyalty/transactions` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor "Customer" as Actor
boundary "API Gateway" as GW
control "Booking Service" as SVC
database "Booking Database" as DB

Actor -> GW: GET /v1/loyalty/transactions
GW -> GW: Validate auth/role/permission
GW -> GW: Validate path/query/body DTO
GW -> SVC: Send `loyalty.getTransactions`
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
| Gateway guard | BR-LY-02-01 | Customer request must pass ClerkAuthGuard; own-scope permissions and ownership checks prevent access to another user's booking, payment, ticket, loyalty, or refund data. |
| Input validation | BR-LY-02-02 | `points` must be numeric and positive for earn/redeem; `type` filter must be LoyaltyTransactionType and pagination uses numeric `page` and `limit` defaults. |
| Route/message boundary | BR-LY-02-03 | Implemented trigger is `GET /v1/loyalty/transactions` and service boundary uses `loyalty.getTransactions`; the gateway must not call stale or pluralized paths that differ from the controller. |
| Business/state rule | BR-LY-02-04 | Loyalty account is scoped to the authenticated user; users cannot read or mutate another user's balance. |
| Business/state rule | BR-LY-02-05 | Redeem must fail with explicit `Insufficient points` when requested points exceed available balance. |
| Business/state rule | BR-LY-02-06 | Earn/redeem operations create auditable loyalty transactions with transactionId/description when supplied. |
| Business/state rule | BR-LY-02-07 | Transaction history supports type filtering and pagination while preserving chronological ordering from the service. |
| Business/state rule | BR-LY-02-08 | List responses must honor supported filters, pagination defaults, and cinema/user scoping before returning data. |
| Integration constraint | BR-LY-02-09 | Gateway forwards the request to the target service through microservice pattern `loyalty.getTransactions` and propagates service errors through the common exception layer. |
| Success response | BR-LY-02-10 | Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| Failure response | BR-LY-02-11 | Expected failures include missing loyalty account and explicit `Insufficient points` for redemption beyond the current balance. |
