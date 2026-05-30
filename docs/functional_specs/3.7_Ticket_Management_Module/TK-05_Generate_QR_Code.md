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
| (3) | BR209 | QR code generation is allowed only for tickets that exist and belong to a valid booking context. |
| (4) | BR210 | QR code payload must be unique per ticket and should use an internal ticket id or validation token rather than customer PII. |
| (4) | BR211 | QR code must be tamper-resistant by relying on server-side validation of ticket id/token and ticket status. |
| (4) | BR212 | QR generation should complete within a few seconds after payment confirmation and must be retryable for email resend/download flows. |
| (4) | BR213 | QR Code Generation technology: `qrcode` v1.5.4. |
| (5) | BR214 | Duplicate or reused QR scans must be rejected by ticket validation/use-ticket rules. |


