# [CM-06] Search Cinemas Nearby

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Search Cinemas Nearby |
| **Functional ID** | CM-06 |
| **Description** | Finds cinemas located within a certain radius of the user's provided coordinates (latitude/longitude). |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/nearby` |
| **Pre-condition** | User provides valid `lat` and `lng` query parameters. |
| **Post-condition** | List of cinemas sorted by distance returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/nearby?lat=...&lng=...&radius=...
GW -> CS: Search Nearby Request
CS -> DB: Query using Haversine/PostGIS
note right of DB: Calculate distance for active cinemas
DB --> CS: List of Cinemas with Distance
CS -> CS: Sort by Distance Ascending
CS --> GW: Cinema List DTO
GW --> User: 200 OK (JSON)
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Enable Location / Provide Coords;
:(2) Request Nearby Cinemas;
|API Gateway|
:(3) Validate Lat/Lng params;
|Cinema Service|
:(4) Calculate Distances (Haversine);
:(5) Filter by Radius (default 10km);
|Database|
:(6) Fetch Candidates;
|Cinema Service|
:(7) Sort Results;
|API Gateway|
:(8) Return List;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (5) | General | Default search radius is typically 10km or 20km if not specified. |
| (6) | SRS 5.2 | Only `ACTIVE` cinemas are returned. |
