# [CM-02] Create Cinema

## Use Case Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Cinema |
| **Description** | Allows an Administrator to register a new cinema location in the system. |
| **Actor** | Authorized Staff |
| **Trigger** | `POST /v1/cinemas/cinema` |
| **Pre-condition** | Caller satisfies gateway auth/permission requirements and request data matches shared DTO/query schema. |
| **Post-condition** | State change is persisted atomically or the request fails without partial data inconsistency. |

## Activities Flow

```plantuml
@startuml
|Authorized Staff|
start
:(1) Send request/event [BR1];
|API Gateway|
:(3) Validate authentication, params, query, and body [BR2];
if (Authorized?) then (yes)
  :(3) Validate required input and format [BR2];
  if (Validation passed?) then (yes)
    |Cinema Service|
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
      |Authorized Staff|
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
actor "Authorized Staff" as Actor
boundary "API Gateway" as GW
control "Cinema Service" as SVC
database "Cinema Database" as DB
control "External Provider / Redis / Related Services" as EXT

Actor -> GW: (1) POST /v1/cinemas/cinema [BR1]
GW -> GW: (3) Validate authentication, params, query, and body [BR2]
GW -> SVC: (5) Send `cinema.create` [BR3]
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
| (1) | BR1 | Loading Screen Rules:<br>❖ The system loads the "Create Cinema" function and receives the request/event.<br>❖ The system uses trigger [POST /v1/cinemas/cinema]. |
| (3) | BR2 | Validate Rules:<br>❖ The system checks the items [name], [address], [city], [district], [phone], [email], [website], [latitude], [longitude], [description], [amenities], [facilities], [images], [virtualTour360Url], [operatingHours], [socialMedia], [timezone].<br>❖ The system validates data according to DTO/schema CreateCinemaRequest.<br>❖ Required fields: [name], [address], [city].<br>❖ If any required entries are empty, the system shows error message MSG 1.<br>❖ Optional fields: [district], [phone], [email], [website], [latitude], [longitude], [description], [amenities], [facilities], [images], [virtualTour360Url], [operatingHours], [socialMedia], [timezone].<br>❖ Default values: [amenities] = [], [images] = [], [timezone] = 'Asia/Ho_Chi_Minh'.<br>❖ Field constraint: [name] is required, type string, minimum 1; maximum 255.<br>❖ Field constraint: [address] is required, type string, minimum 1.<br>❖ Field constraint: [city] is required, type string, minimum 1; maximum 100.<br>❖ Field constraint: [district] is optional, type string, maximum 100.<br>❖ Field constraint: [phone] is optional, type string, maximum 20.<br>❖ Field constraint: [email] is optional, type string, maximum 255; must be an email format.<br>❖ Field constraint: [website] is optional, type string.<br>❖ Field constraint: [latitude] is optional, type number, is coerced from request input.<br>❖ Field constraint: [longitude] is optional, type number, is coerced from request input.<br>❖ Field constraint: [description] is optional, type string.<br>❖ Field constraint: [amenities] is optional, type array<string>, default [].<br>❖ Field constraint: [images] is optional, type array<string>, default [].<br>❖ Field constraint: [virtualTour360Url] is optional, type string.<br>❖ Field constraint: [timezone] is optional, type string, default 'Asia/Ho_Chi_Minh'.<br>❖ If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4. |
| (5) | BR3 | Creating Rules:<br>❖ The system executes the main business operation and returns the requested data or persists the state change consistently.<br>❖ Create actions must reject duplicate/conflicting records before persistence and return the created DTO after persistence. |
| (7) | BR4 | Message Rules:<br>❖ Successful write/validation/state-changing operations return service data with MSG 7 where the service wraps a ServiceResult; pure reads return the requested DTO/list. |
| (8) | BR5 | Error Handling Rules:<br>❖ Gateway forwards the request to the target service through microservice pattern cinema.create and propagates service errors through the common exception layer.<br>❖ If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9. |
