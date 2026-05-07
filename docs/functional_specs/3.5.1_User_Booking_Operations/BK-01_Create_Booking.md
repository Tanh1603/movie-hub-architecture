# [BK-01] Create Booking

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Booking |
| **Functional ID** | BK-01 |
| **Description** | Initiates a new booking for a specific showtime and set of held seats. |
| **Actor** | Member |
| **Trigger** | `POST /v1/bookings` |
| **Pre-condition** | Member authenticated; Seats held in Redis; Showtime is active. |
| **Post-condition** | Booking created with status `PENDING`; Expiry timer started. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
control "Cinema Service" as CS
entity "Database (Booking)" as DB_B
entity "Database (Cinema)" as DB_C

Member -> GW: POST /v1/bookings (showtimeId, seats, concessions)
GW -> GW: Validate Auth
GW -> BS: Create Booking Request
BS -> CS: Verify & Convert Held Seats
CS -> DB_C: Create Seat Reservations (Status: CONFIRMED)
DB_C --> CS: Success
CS --> BS: Seat Details & Pricing
BS -> DB_B: Insert Booking (Status: PENDING)
DB_B --> BS: New Booking ID
BS --> GW: Booking DTO
GW --> Member: 201 Created
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Request Booking;
|API Gateway|
:(2) Validate Authorization;
|Booking Service|
:(3) Verify Seat Hold Status;
:(4) Calculate Total Price;
|Cinema Service|
:(5) Create Seat Reservations;
|Booking Service|
:(6) Check BR-BOOK-02: One pending per showtime;
if (Allowed?) then (Yes)
    |Database|
    :(7) Save Booking (Status: PENDING);
    |Booking Service|
    :(8) Set Expiry Timer (15m);
    |API Gateway|
    :(9) Return Booking ID;
    stop
else (No)
    |API Gateway|
    :(10) Return Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (8) | BR-BOOK-01 | Booking expiry time: 15 minutes from creation. |
| (6) | BR-BOOK-02 | Only one pending booking per user per showtime is allowed. |
| (4) | BR-PAY-03 | VAT rate: 10% on all transactions. |
