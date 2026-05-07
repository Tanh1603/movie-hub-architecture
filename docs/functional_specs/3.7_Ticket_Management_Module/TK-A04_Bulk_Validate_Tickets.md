# [TK-A04] Bulk Validate Tickets

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Bulk Validate Tickets |
| **Functional ID** | TK-A04 |
| **Description** | Allows an Admin to validate a list of tickets simultaneously. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/tickets/admin/bulk-validate` |
| **Pre-condition** | Admin authenticated; List of ticket IDs provided. |
| **Post-condition** | Validation report for all IDs returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: POST /v1/tickets/admin/bulk-validate (ticketIds[])
GW -> BS: Bulk Validate Request
loop for each ID
    BS -> DB: Check Status
    BS -> BS: Record Result
end
BS --> GW: Bulk Result DTO
GW --> Admin: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select multiple tickets;
:(2) Request Bulk Validation;
|API Gateway|
:(3) Validate Authorization;
|Booking Service|
:(4) Iterate through ID list;
while (Has more IDs?) is (Yes)
    :(5) Verify individual ticket status;
endwhile (No)
|API Gateway|
:(6) Return Aggregated Results;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Typically used for mass entry processing or system-wide checks. |
