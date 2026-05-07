# [BK-A04] Update Booking Status

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Booking Status |
| **Functional ID** | BK-A04 |
| **Description** | Allows an Administrator to manually override the status of a booking (e.g., for troubleshooting or manual overrides). |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/bookings/admin/:id/status` |
| **Pre-condition** | Admin authenticated; Booking exists; Target status is valid. |
| **Post-condition** | Booking status updated in database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Admin -> GW: PUT /v1/bookings/admin/:id/status (newStatus)
GW -> BS: Update Status Request
BS -> DB: Find Booking
alt Found
    BS -> DB: Update Status SET status = :status
    DB --> BS: Success
    BS --> GW: 200 OK
else Not Found
    BS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Select Booking;
:(2) Select New Status;
|API Gateway|
:(3) Validate Authorization;
|Booking Service|
:(4) Verify target status is valid Enum member;
|Database|
:(5) Commit Status Change;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Target status must be a valid member of `BookingStatus` enum. |
| (5) | N/A | Changing status manually should be logged for auditing purposes. |
