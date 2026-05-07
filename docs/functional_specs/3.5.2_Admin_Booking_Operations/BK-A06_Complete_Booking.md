# [BK-A06] Complete Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Complete Booking |
| **Functional ID** | BK-A06 |
| **Description** | Marks a CONFIRMED booking as COMPLETED. This usually happens automatically after the showtime ends or manually by an Admin. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/bookings/admin/:id/complete` |
| **Pre-condition** | Admin authenticated; Booking status is CONFIRMED. |
| **Post-condition** | Booking status set to COMPLETED. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: POST /v1/bookings/admin/:id/complete
GW -> BS: Complete Booking Request
BS -> DB: Verify status is CONFIRMED
alt CONFIRMED
    BS -> DB: Update status = 'COMPLETED'
    DB --> BS: Success
    BS --> GW: 200 OK
else Invalid Status
    BS --> GW: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Manual Completion;
|API Gateway|
:(2) Verify Permissions;
|Booking Service|
:(3) Check if status is CONFIRMED;
if (Is CONFIRMED?) then (Yes)
    |Database|
    :(4) Update status to COMPLETED;
    |API Gateway|
    :(5) Return Success;
    stop
else (No)
    |API Gateway|
    :(6) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | COMPLETED status indicates the service has been successfully rendered (user attended). |
