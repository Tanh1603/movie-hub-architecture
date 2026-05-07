# [ST-04] Create Batch Showtimes

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Batch Showtimes |
| **Functional ID** | ST-04 |
| **Description** | Allows an Admin to create multiple showtimes at once (e.g., for an entire week) using a template or list of times. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/showtimes/batch` |
| **Pre-condition** | Admin authenticated; Valid list of showtime payloads. |
| **Post-condition** | Multiple showtimes created; Any conflicting entries are reported. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: POST /v1/showtimes/batch
GW -> GW: Validate Admin Role
GW -> CS: Create Batch Request
loop for each showtime
    CS -> DB: Check Conflict
    alt No Conflict
        CS -> DB: Insert Record
    else Conflict
        CS -> CS: Log Error for Item
    end
end
CS --> GW: Batch Result Summary
GW --> Admin: 207 Multi-Status (Success/Failure list)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Input Multiple Showtime Data;
:(2) Submit Batch;
|API Gateway|
:(3) Validate Role;
|Cinema Service|
:(4) Iterate through Payload;
while (Has more items?) is (Yes)
    :(5) Validate & Check Conflict;
    if (Valid?) then (Yes)
        |Database|
        :(6) Insert Record;
    else (No)
        |Cinema Service|
        :(7) Record Failure;
    endif
endwhile (No)
|API Gateway|
:(8) Return Summary Report;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | General | Batch processing must handle partial successes (Atomic per record). |
| (5) | General | Conflict rules from ST-03 apply to each item. |
