# [MR-01] Create Movie Release

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Create Movie Release |
| **Functional ID** | MR-01 |
| **Description** | Creates a new release entry for a movie, specifying the release date, end date, and format (e.g., 2D, 3D, IMAX). |
| **Actor** | Admin |
| **Trigger** | `POST /v1/movie-releases` |
| **Pre-condition** | Admin authenticated; Movie ID exists; Valid release dates. |
| **Post-condition** | Movie release record created. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor Admin
boundary "API Gateway" as GW
control "Movie Service" as MS
entity "Database (Movie)" as DB

Admin -> GW: POST /v1/movie-releases
GW -> GW: Validate Admin Role
GW -> MS: Create Release Request
MS -> DB: Check Movie Existence
alt Movie Exists
    MS -> DB: Insert Movie Release
    DB --> MS: Success
    MS --> GW: 201 Created
else Movie Not Found
    MS --> GW: 404 Not Found
end
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|Admin|
start
:(1) Input Release Details (Date, Format);
:(2) Submit Request;
|API Gateway|
:(3) Validate Authorization;
|Movie Service|
:(4) Verify Movie ID;
if (Movie Exists?) then (Yes)
    :(5) Save Release Record;
    |Database|
    :(6) Commit Transaction;
    |API Gateway|
    :(7) Return Success;
    stop
else (No)
    |API Gateway|
    :(8) Return 404 Not Found;
    stop
endif
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (1) | N/A | Format must be one of: `TWO_D`, `THREE_D`, `IMAX`, `FOUR_DX` (Movie Service Enums). |
| (1) | N/A | End date must be after the release date. |
