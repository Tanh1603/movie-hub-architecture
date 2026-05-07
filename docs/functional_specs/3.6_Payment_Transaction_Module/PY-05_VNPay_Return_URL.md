# [PY-05] VNPay Return URL

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | VNPay Return URL |
| **Functional ID** | PY-05 |
| **Description** | The browser redirect endpoint where users are sent after completing payment on the VNPay UI. It provides immediate feedback to the user. |
| **Actor** | Member |
| **Trigger** | `GET /v1/payments/vnpay/return` |
| **Pre-condition** | User redirected from VNPay. |
| **Post-condition** | User redirected to Frontend success or failure page. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
participant "VNPay UI" as VNPay
boundary "API Gateway" as GW
control "Booking Service" as BS

Member -> VNPay: Complete Payment
VNPay -> Member: Redirect to /v1/payments/vnpay/return
Member -> GW: GET /v1/payments/vnpay/return
GW -> BS: Handle Return Request
BS -> BS: Verify Signature
alt Success (vnp_ResponseCode == "00")
    BS --> GW: Redirect to FE /success?bookingId=...
else Failure
    BS --> GW: Redirect to FE /failure?bookingId=...
end
GW --> Member: Redirect to Frontend UI
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
|VNPay Gateway|
|API Gateway|
|Booking Service|

|VNPay Gateway|
start
:(1) Process Transaction;
:(2) Redirect User to Return URL;
|Member|
:(3) Request Return URL;
|API Gateway|
:(4) Forward to Booking Service;
|Booking Service|
:(5) Verify Data Integrity;
if (Transaction Successful?) then (Yes)
    |API Gateway|
    :(6) Redirect to Success Page;
else (No)
    |API Gateway|
    :(7) Redirect to Failure Page;
endif
|Member|
:(8) View Result on Frontend;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | N/A | Immediate feedback only. Data consistency is guaranteed by PY-04 (IPN). |
| (6) | N/A | Success page should display booking summary and link to tickets. |
