# [CM-03] Update Cinema

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Cinema |
| **Functional ID** | CM-03 |
| **Description** | Modifies the details of an existing cinema (e.g., name, address, status). |
| **Actor** | Admin |
| **Trigger** | `PATCH /v1/cinemas/cinema/:cinemaId` |
| **Pre-condition** | Admin authenticated; Cinema ID exists. |
| **Post-condition** | Cinema record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

Admin -> GW: PATCH /v1/cinemas/cinema/:id
GW -> GW: Check Admin Role
GW -> CS: Update Request
CS -> DB: Update Cinema SET ... WHERE id = :id
alt Success
    DB --> CS: Updated Record
    CS --> GW: 200 OK
else Not Found
    DB --> CS: null
    CS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Request Update;
|API Gateway|
:(2) Validate Role;
|Cinema Service|
:(3) Check ID Existence;
if (Exists?) then (Yes)
    :(4) Apply Changes;
    |Database|
    :(5) Update Record;
    |API Gateway|
    :(6) Return Updated Data;
    stop
else (No)
    |API Gateway|
    :(7) Return 404;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | SRS 5.2 | If status is changed to `CLOSED` or `MAINTENANCE`, it may impact future showtimes (though not explicitly enforced in this atomic op, it's a systemic implication). |
