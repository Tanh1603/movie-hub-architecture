# [GM-04] Update Genre

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Genre |
| **Functional ID** | GM-04 |
| **Description** | Modifies an existing movie genre's name. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/genres/:id` |
| **Pre-condition** | Admin authenticated; Genre ID exists. |
| **Post-condition** | Genre record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: PUT /v1/genres/:id
GW -> GW: Check Admin Role
GW -> MS: Update Request
MS -> DB: Check Genre Existence
alt Exists
    MS -> DB: Update Genre Name
    DB --> MS: Success
    MS --> GW: 200 OK
else Not Found
    MS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Edit Genre Name;
:(2) Submit Update;
|API Gateway|
:(3) Validate Role;
|Movie Service|
:(4) Find Record;
if (Found?) then (Yes)
    :(5) Update in DB;
    |Database|
    :(6) Commit;
    |API Gateway|
    :(7) Return Success;
    stop
else (No)
    |API Gateway|
    :(8) Return 404;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | General | Updated genre name must not conflict with other existing genre names. |
