# [MR-02] Update Movie Release

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Movie Release |
| **Functional ID** | MR-02 |
| **Description** | Updates an existing movie release's schedule or format. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/movie-releases/:id` |
| **Pre-condition** | Admin authenticated; Release ID exists. |
| **Post-condition** | Movie release updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: PUT /v1/movie-releases/:id
GW -> GW: Validate Admin Role
GW -> MS: Update Release Request
MS -> DB: Find Release Record
alt Found
    MS -> DB: Update Fields
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
:(1) Edit Release Details;
:(2) Submit Update;
|API Gateway|
:(3) Validate Role;
|Movie Service|
:(4) Locate Release Record;
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
| (5) | N/A | Updating a release format or date might affect scheduled showtimes (Manual reconciliation required). |
