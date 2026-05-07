# [MV-05] Update Movie

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Update Movie |
| **Functional ID** | MV-05 |
| **Description** | Modifies the information of an existing movie. |
| **Actor** | Admin |
| **Trigger** | `PUT /v1/movies/:id` |
| **Pre-condition** | Admin authenticated; Movie ID exists. |
| **Post-condition** | Movie record updated. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: PUT /v1/movies/:id (Update Data)
GW -> GW: Check Admin Role
GW -> MS: Update Request
MS -> DB: Find & Update Movie
DB --> MS: Updated Record
MS --> GW: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Edit Movie Details;
:(2) Submit Update;
|API Gateway|
:(3) Validate Role;
|Movie Service|
:(4) Update Record;
|Database|
:(5) Commit Changes;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (4) | N/A | Can update title, overview, release date, runtime, poster, trailer, backdrop, age rating. |
| (4) | SRS 5.1 | Updates to genres should also be handled (if included in payload). |
