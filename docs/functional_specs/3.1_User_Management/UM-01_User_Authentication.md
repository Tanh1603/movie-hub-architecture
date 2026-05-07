# [UM-01] User Authentication

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | User Authentication |
| **Functional ID** | UM-01 |
| **Description** | Allows guests to sign up or log in via Clerk (external identity provider) and obtain a session token for accessing protected resources. |
| **Actor** | Guest, Member |
| **Trigger** | External Interaction (Clerk UI) |
| **Pre-condition** | User has a valid email or social account. |
| **Post-condition** | User receives a JWT token; User session is established. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
participant "Clerk Frontend" as ClerkUI
participant "API Gateway" as GW
participant "Clerk Backend" as ClerkAPI

User -> ClerkUI: Click Login/Register
ClerkUI -> ClerkAPI: Authenticate (Email/Social)
ClerkAPI --> ClerkUI: Return Session Token (JWT)
User -> GW: Request Protected Resource (w/ Bearer Token)
GW -> ClerkAPI: Verify Token Signature
alt Token Valid
    ClerkAPI --> GW: Token Claims (User ID, Email)
    GW -> GW: Allow Request
else Token Invalid
    GW -> User: 401 Unauthorized
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Guest|
start
:(1) Request Login/Register;
|Clerk System|
:(2) Present Authentication UI;
:(3) Validate Credentials;
if (Valid?) then (Yes)
    :(4) Generate Session Token;
    |Guest|
    :(5) Receive Token;
    stop
else (No)
    |Clerk System|
    :(6) Show Error Message;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Authentication is handled entirely by Clerk (Third-party). |
| (5) | N/A | Tokens must be included in the `Authorization` header for all protected API calls (Section 6.1). |
