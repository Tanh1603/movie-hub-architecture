# [CM-04] Delete Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Delete Cinema |
| **Functional ID** | CM-04 |
| **Description** | Soft-deletes or permanently removes a cinema from the system. |
| **Actor** | Admin |
| **Trigger** | `DELETE /v1/cinemas/cinema/:cinemaId` |
| **Pre-condition** | Admin authenticated; Cinema exists. |
| **Post-condition** | Cinema removed or marked deleted. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: DELETE /v1/cinemas/cinema/:id
GW -> GW: Check Admin Role
GW -> CS: Delete Request
CS -> DB: Check Dependencies (Bookings/Showtimes)
alt Safe to Delete
    CS -> DB: Delete/Soft Delete
    DB --> CS: Success
    CS --> GW: 200 OK
else Dependencies Exist
    CS --> GW: 409 Conflict (Cannot delete active cinema)
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Deletion;
|API Gateway|
:(2) Validate Role;
|Cinema Service|
:(3) Check for Active Showtimes/Bookings;
if (Has Dependencies?) then (Yes)
    |Cinema Service|
    :(4) Reject Request;
    |API Gateway|
    :(5) Return 409 Conflict;
    stop
else (No)
    |Database|
    :(6) Execute Delete;
    |API Gateway|
    :(7) Return Success;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | Typically, cinemas with past historical data (bookings) should be Soft Deleted (status = CLOSED/DELETED) rather than physically removed to preserve reporting integrity. |
