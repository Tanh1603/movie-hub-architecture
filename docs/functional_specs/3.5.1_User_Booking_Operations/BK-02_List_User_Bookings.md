# [BK-02] List User Bookings

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | List User Bookings |
| **Functional ID** | BK-02 |
| **Description** | Retrieves the booking history for the authenticated member. |
| **Actor** | Member |
| **Trigger** | `GET /v1/bookings` |
| **Pre-condition** | Member authenticated. |
| **Post-condition** | List of user's bookings returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB

Member -> GW: GET /v1/bookings
GW -> BS: Get User Bookings Request
BS -> DB: SELECT * FROM Bookings WHERE userId = :id ORDER BY createdAt DESC
DB --> BS: List of Bookings
BS --> GW: Booking List DTO
GW --> Member: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request My Bookings;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Query User's History;
|Database|
:(4) Return Records;
|Booking Service|
:(5) Map to Summary DTOs;
|API Gateway|
:(6) Return Response;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Only returns bookings belonging to the requesting user. |
