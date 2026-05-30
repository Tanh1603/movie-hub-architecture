# [PY-04] VNPay IPN Webhook

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | VNPay IPN Webhook |
| **Functional ID** | PY-04 |
| **Description** | An asynchronous callback from VNPay to update the payment and booking status after a transaction is completed by the user. |
| **Actor** | System (VNPay) |
| **Trigger** | `GET /v1/payments/vnpay/ipn` |
| **Pre-condition** | Request includes valid VNPay parameters and signature. |
| **Post-condition** | Payment status updated; Booking status confirmed if successful; Tickets generated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
participant "VNPay Gateway" as VNPay
boundary "API Gateway" as GW
control "Booking Service" as BS
entity "Database (Booking)" as DB
participant "Redis (Pub/Sub)" as R

VNPay -> GW: GET /v1/payments/vnpay/ipn (Data + Hash)
GW -> BS: Handle IPN Request
BS -> BS: Verify BR-PAY-02: Signature & Params
alt Signature Valid
    BS -> DB: Find Payment & Booking
    alt Payment Success (vnp_ResponseCode == "00")
        BS -> DB: Update Payment (COMPLETED)
        BS -> DB: Update Booking (CONFIRMED)
        BS -> BS: Generate Tickets
        BS -> R: Publish "booking.confirmed"
        BS --> GW: { RspCode: "00", Message: "Confirm Success" }
    else Payment Failed
        BS -> DB: Update Payment (FAILED)
        BS --> GW: { RspCode: "00", Message: "Confirm Success" }
    end
else Invalid Signature
    BS --> GW: { RspCode: "97", Message: "Checksum failed" }
end
GW --> VNPay: HTTP 200 (JSON Response)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|VNPay Gateway|
start
:(1) Send IPN Notification;
|API Gateway|
:(2) Forward to Booking Service;
|Booking Service|
:(3) Verify Secure Hash;
if (Hash Valid?) then (Yes)
    :(4) Fetch Payment Record;
    if (vnp_ResponseCode == "00"?) then (Yes)
        |Database|
        :(5) Update Payment to COMPLETED;
        :(6) Update Booking to CONFIRMED;
        |Booking Service|
        :(7) Generate Digital Tickets;
        :(8) Publish 'booking.confirmed';
    else (No)
        |Database|
        :(9) Update Payment to FAILED;
    endif
    |Booking Service|
    :(10) Return RspCode "00" (Success);
else (No)
    |Booking Service|
    :(11) Return RspCode "97" (Checksum Error);
endif
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | BR189 | Gateway webhook endpoints are public but must be protected by provider signature validation and configured IP allowlist where available. |
| (3) | BR190 | VNPay callbacks must validate HMAC-SHA512 before any database mutation. |
| (3) | BR191 | Stale, duplicate, missing-identity, or invalid-signature callbacks must be acknowledged safely without mutating payment state. |
| (4) | BR192 | IPN must verify payment existence, booking existence, amount equality, booking expiry, and valid state before applying changes. |
| (5) | BR193 | Successful IPN transitions payment `PENDING -> COMPLETED`, booking `PENDING -> CONFIRMED`, and tickets to `VALID` in one atomic transaction. |
| (9) | BR194 | Failed provider status transitions payment `PENDING -> FAILED` and must not create valid tickets. |
| (8) | BR195 | Confirmation notification, QR generation, and Redis seat confirmation event must be triggered asynchronously and must not block the IPN response. |
| (10) | BR196 | VNPay IPN must return the exact provider response shape `{ RspCode: string, Message: string }`. |


