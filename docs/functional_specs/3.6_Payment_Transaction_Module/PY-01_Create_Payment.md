# [PY-01] Create Payment

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Payment |
| **Functional ID** | PY-01 |
| **Description** | Initiates a payment transaction for a specific booking using a chosen payment gateway (e.g., VNPay). |
| **Actor** | Member |
| **Trigger** | `POST /v1/payments/bookings/:bookingId` |
| **Pre-condition** | Booking exists and status is PENDING; Member authenticated. |
| **Post-condition** | Payment record created (PENDING); Redirect URL generated for the member. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
participant "VNPay Service" as VNPay
entity "Database (Booking)" as DB

Member -> GW: POST /v1/payments/bookings/:bookingId
GW -> BS: Create Payment Request
BS -> DB: Fetch Booking Details
BS -> DB: Create Payment Record (Status: PENDING)
BS -> VNPay: Generate Payment URL (Amount, OrderInfo)
VNPay --> BS: Payment URL
BS --> GW: Redirect URL DTO
GW --> Member: 200 OK (with Redirect URL)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Confirm Payment;
|API Gateway|
:(2) Forward Request;
|Booking Service|
:(3) Verify Booking Eligibility;
:(4) Create PENDING Payment Record;
|VNPay Service|
:(5) Construct Payment URL with Signature;
|Booking Service|
:(6) Return URL to Gateway;
|API Gateway|
:(7) Return Response;
|Member|
:(8) Redirect to Payment Gateway UI;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR-BOOK-01 | Payment must be initiated within 15 minutes of booking creation. |
| (5) | N/A | URL must include a secure hash (HMAC-SHA512) for integrity. |
