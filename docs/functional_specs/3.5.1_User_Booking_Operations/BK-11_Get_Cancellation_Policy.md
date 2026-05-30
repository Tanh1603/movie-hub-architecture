# [BK-11] Get Cancellation Policy

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get Cancellation Policy |
| **Functional ID** | BK-11 |
| **Description** | Returns the human-readable text of the platform's cancellation and refund policy. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/bookings/cancellation-policy` |
| **Pre-condition** | None. |
| **Post-condition** | Policy text returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Booking Service" as BS

User -> GW: GET /v1/bookings/cancellation-policy
GW -> BS: Get Policy Request
BS -> BS: Load static/dynamic policy text
BS --> GW: Policy Text
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Click 'Cancellation Policy';
|API Gateway|
:(2) Fetch Policy;
|Booking Service|
:(3) Retrieve defined rules text;
|API Gateway|
:(4) Return Policy Content;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | BR166 | Policy response must expose the current cancellation deadline used by booking-service. |
| (3) | BR167 | Policy response must expose the current refund percentage and whether concessions/service fees are refundable. |
| (3) | BR168 | Policy response must expose the maximum reschedule count. |
| (3) | BR169 | Policy text must be understandable to members before they confirm cancellation or exchange. |
| (3) | BR170 | Policy constants must be easy to update when business rules change. |


