# [MV-04] Create Movie

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Movie |
| **Functional ID** | MV-04 |
| **Description** | Allows an Administrator to add a new movie to the platform. |
| **Actor** | Admin |
| **Trigger** | `POST /v1/movies` |
| **Pre-condition** | Admin authenticated; Valid payload. |
| **Post-condition** | Movie created in database. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: POST /v1/movies
GW -> GW: Check Admin Role
GW -> MS: Create Movie DTO
MS -> DB: Insert Movie
DB --> MS: Created Record (ID)
MS --> GW: 201 Created
GW --> Admin: Success Response
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Enter Movie Metadata;
:(2) Submit Request;
|API Gateway|
:(3) Validate Permissions;
|Movie Service|
:(4) Create Record in DB;
|Database|
:(5) Save Data;
|API Gateway|
:(6) Return Success;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | SRS 5.1 | Required: Title, Overview, Poster URL, Backdrop URL, Trailer URL, Release Date, Runtime, Age Rating. |
