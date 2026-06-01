# [LY-01] Get Loyalty Balance

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Loyalty Balance |
| **Description** | Retrieves the current loyalty points balance and membership tier for the authenticated member. |
| **Actor** | Customer |
| **Trigger** | `GET /v1/loyalty/balance` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | Requested data is returned or the targeted state change is persisted consistently. |

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

Actor -> GW: (1) GET /v1/loyalty/balance [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `loyalty.getBalance` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Get Loyalty Balance" function and receives the request/event.<br>❖ The system uses trigger [GET /v1/loyalty/balance]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks actor permission, path parameters, query values, and request body before processing.<br>❖ Customer request must pass ClerkAuthGuard; own-scope permissions and ownership checks prevent access to another user's booking, payment, ticket, loyalty, or refund data.<br>❖ Implemented trigger is GET /v1/loyalty/balance and service boundary uses loyalty.getBalance; the gateway must not call stale or pluralized paths that differ from the controller.<br>❖ Loyalty account is scoped to the authenticated user; users cannot read or mutate another user's balance.<br>❖ If any mandatory entries are empty, the system shows error message MSG 1.<br>❖ If request information is not in the correct format, the system shows error message MSG 4. |
| (5) | BR3 | Retrieval Rules:<br>❖ points must be numeric and positive for earn/redeem; type filter must be LoyaltyTransactionType and pagination uses numeric page and limit defaults.<br>❖ Redeem must fail with explicit Insufficient points when requested points exceed available balance.<br>❖ Earn/redeem operations create auditable loyalty transactions with transactionId/description when supplied.<br>❖ Transaction history supports type filtering and pagination while preserving chronological ordering from the service. |
| (7) | BR4 | Message Rules:<br>❖ Successful read operations return the requested DTO/list using the gateway's normal response wrapper; no artificial success text is invented by the spec. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern loyalty.getBalance and propagates service errors through the common exception layer.<br>❖ Expected failures include missing loyalty account and explicit Insufficient points for redemption beyond the current balance.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
