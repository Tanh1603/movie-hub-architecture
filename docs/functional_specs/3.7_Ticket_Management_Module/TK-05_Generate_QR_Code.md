# [TK-05] Generate QR Code

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Generate QR Code |
| **Functional ID** | TK-05 |
| **Description** | Generates a base64-encoded QR code image containing the unique ticket ID or code for scanning. |
| **Actor** | Member |
| **Trigger** | `GET /v1/tickets/:id/qr` |
| **Pre-condition** | Ticket exists and belongs to the Member. |
| **Post-condition** | QR Code image (base64) returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Member
boundary "API Gateway" as GW
control "Booking Service" as BS
participant "QR Library" as QR

Member -> GW: GET /v1/tickets/:id/qr
GW -> BS: Get QR Code Request
BS -> BS: Find Ticket & Verify Ownership
BS -> QR: Generate QR (data: ticketId)
QR --> BS: Image Buffer / Base64
BS --> GW: QR Image DTO
GW --> Member: 200 OK (Image/Base64)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Member|
start
:(1) Click 'View QR Code';
|API Gateway|
:(2) Request QR Generation;
|Booking Service|
:(3) Retrieve Ticket Data;
:(4) Invoke QR Generation Library;
|QR Library|
:(5) Create Image;
|Booking Service|
:(6) Encode to Base64;
|API Gateway|
:(7) Return Image to UI;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | QR code typically contains the ticket's internal UUID or a specialized validation token. |
| (4) | SRS 1.2 | QR Code Generation technology: `qrcode` v1.5.4. |
