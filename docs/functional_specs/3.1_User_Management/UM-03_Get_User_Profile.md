# [UM-03] Get User Profile (Sync)

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Get User Profile (Clerk Webhook Sync) |
| **Functional ID** | UM-03 |
| **Description** | Synchronizes user data from Clerk to the local User Service database via Webhook when a user registers or updates their profile in Clerk. |
| **Actor** | Member (via Clerk System) |
| **Trigger** | Clerk Webhook Event (`user.created`, `user.updated`) |
| **Pre-condition** | Valid Webhook Signature from Clerk. |
| **Post-condition** | User record created or updated in `postgres-user`. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
participant "Clerk System" as Clerk
boundary "API Gateway" as GW
control "User Service" as US
entity "Database (User)" as DB

User -> Clerk: Update Profile / Register
Clerk -> GW: POST /webhooks/clerk (Event Payload)
GW -> GW: Validate Svix Signature
alt Signature Valid
    GW -> US: Sync User Data (Event)
    US -> DB: Upsert User Record
    DB --> US: Success
    US --> GW: Ack
    GW --> Clerk: 200 OK
else Invalid Signature
    GW --> Clerk: 400 Bad Request
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Clerk System|
start
:(1) Detect User Change;
:(2) Send Webhook Request;
|API Gateway|
:(3) Verify Webhook Signature;
if (Valid?) then (Yes)
    |User Service|
    :(4) Extract User Details;
    :(5) Check if User Exists;
    if (Exists?) then (Yes)
        |Database|
        :(6) Update User Record;
    else (No)
        |Database|
        :(7) Create New User;
    endif
    |API Gateway|
    :(8) Return 200 OK;
    stop
else (No)
    |API Gateway|
    :(9) Log Security Warning;
    :(10) Return 400 Error;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | N/A | Webhooks must be verified using the Svix secret to prevent spoofing. |
| (7) | BR-LOYALTY-04 | New accounts may need initialization of Loyalty Account (Bronze Tier). |
