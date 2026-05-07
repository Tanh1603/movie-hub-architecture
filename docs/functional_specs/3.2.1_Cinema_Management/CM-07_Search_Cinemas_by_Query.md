# [CM-07] Search Cinemas by Query

## 1. Description

| Field | Details |
| :--- | :--- |
| **Name** | Search Cinemas by Query |
| **Functional ID** | CM-07 |
| **Description** | Allows users to search for cinemas by name or address using a text string. |
| **Actor** | Guest, Member |
| **Trigger** | `GET /v1/cinemas/search` |
| **Pre-condition** | Query string provided (e.g., `q=Galaxy`). |
| **Post-condition** | List of matching cinemas returned. |

## 2. Sequence Flow

```plantuml
@startuml
autonumber
actor User
boundary "API Gateway" as GW
control "Cinema Service" as CS
entity "Database (Cinema)" as DB

User -> GW: GET /v1/cinemas/search?q=Vincom
GW -> CS: Search Request
CS -> DB: SELECT * FROM Cinemas WHERE name ILIKE %q% OR address ILIKE %q%
DB --> CS: Matching Records
CS --> GW: Cinema List DTO
GW --> User: 200 OK
@enduml
```

## 3. Activity Flow

```plantuml
@startuml
|User|
start
:(1) Enter Search Term;
|API Gateway|
:(2) Forward Search Request;
|Cinema Service|
:(3) Construct Text Search Query;
|Database|
:(4) Execute Fuzzy Match;
|Cinema Service|
:(5) Format Results;
|API Gateway|
:(6) Return Matches;
stop
@enduml
```

## 4. Business Rules

| Activity Step | Rule ID | Description |
| :--- | :--- | :--- |
| (3) | General | Search should be case-insensitive. |
