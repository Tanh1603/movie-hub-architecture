# FUNCTION POINT ANALYSIS (FPA) RULES

# 1. PURPOSE

This document defines the Function Point Analysis (FPA) rules for the Movie Booking Microservice System.

The goal is to:

- classify business functions consistently
- estimate Function Points deterministically
- avoid hallucinated classifications
- standardize FP estimation across multiple agent runs

---

# 2. PROJECT SCOPE

Analyze ONLY the following locations.

## Backend

- `apps/*/src/**/*.controller.ts`
- `apps/*/src/**/*.service.ts`
- `apps/*/prisma/schema.prisma`

## Frontend

- `apps/admin-web/app/**`
- `apps/customer-web/app/**`

Ignore:

- `node_modules`
- `dist`
- `docker`
- `scripts`
- `monitoring`
- generated files
- temporary files
- cache files

---

# 3. SOURCE OF TRUTH

The ONLY valid business functions are defined inside:

`docs/function_point/FPA_FUNCTIONS.md`

Rules:

- Do NOT invent new functions
- Do NOT merge functions
- Do NOT rename functions
- Ignore summary rows
- Ignore formula rows
- Ignore totals section

---

# 4. FUNCTION POINT CATEGORIES

# C1 — External Input (EI)

## Definition

Functions that CREATE, UPDATE, DELETE, or MODIFY data.

## Detect From

- POST endpoints
- PUT endpoints
- PATCH endpoints
- DELETE endpoints
- form submissions
- mutations
- transactional workflows

## Typical Examples

- Account Registration
- Manage Bookings
- Apply Discount Coupons
- Movie Scheduling

## Complexity Weights (W1)

### Simple CRUD → 3

Simple create/update/delete without major validation.

Examples:

- Create Genre
- Update Cinema
- Delete Promotion

### Validation / Relations → 4

Contains:

- validation
- entity relations
- business rules

Examples:

- Account Registration
- Employee Management
- Promotion Management

### Transaction / Workflow → 6

Multi-step business transaction.

Examples:

- Ticket Payment
- Booking Confirmation
- Cancel & Exchange Tickets

---

# C2 — External Output (EO)

## Definition

Functions generating processed outputs.

## Detect From

- dashboard
- analytics
- reports
- export
- invoice
- generated ticket
- reconciliation

## IMPORTANT

Simple GET/list/detail pages are NOT C2.

C2 requires generated or processed outputs.

## Typical Examples

- Executive Dashboard
- Detailed Analytics Reports
- Receive E-Ticket

## Complexity Weights (W2)

### Basic Output → 4

Simple generated output.

### Aggregated Output → 5

Combined or multi-source output.

### Analytics / Dashboard / Export → 7

Complex reporting or analytical output.

---

# C3 — External Inquiry (EQ)

## Definition

Functions that retrieve, search, filter, or display data.

## Detect From

- GET endpoints
- queries
- search
- filtering
- list pages
- detail pages

## Typical Examples

- Search Movies
- View Movie Details
- Select Cinema
- Select Seats

## Complexity Weights (W3)

### Simple Query → 3

Simple list/detail retrieval.

### Search / Filter → 4

Search with filters, sorting, pagination.

### Complex Query → 6

Multi-condition or aggregated query.

---

# C4 — Internal Logical File (ILF)

## Definition

Persistent internal business entities managed by the system.

## Detect From

- Prisma models
- database tables
- important domain entities

## IMPORTANT

A function SHOULD contribute to C4 ONLY IF:

- it directly manages persistent entities
  OR
- it creates/updates core business records
  OR
- it strongly depends on transactional entities

DO NOT assign C4 automatically to every function.

Simple viewing/searching pages MAY NOT need C4.

## Typical Entities

- User
- Movie
- Genre
- Cinema
- Hall
- Showtime
- Seat
- Reservation
- Ticket
- Payment
- Promotion
- Review
- Staff
- TicketPricing

## Complexity Weights (W4)

### Small Entity → 7

- few fields
- few relations

Examples:

- Genre
- Review
- Staff

### Medium Entity → 10

- moderate relations
- moderate business importance

Examples:

- Movie
- Cinema
- Promotion

### Complex Entity / Workflow Entity → 15

Core transactional entities.

Examples:

- Booking
- Reservation
- Payment
- Showtime
- Ticket

---

# C5 — External Interface File (EIF)

## Definition

External systems or integrations.

## Detect From

- VNPay
- MoMo
- Stripe
- Firebase
- OAuth
- webhooks
- external APIs
- notification providers

## IMPORTANT

Do NOT assign C5 unless there is REAL external integration evidence.

Keyword matching alone is NOT enough.

## Typical Examples

- Ticket Payment
- System Login (OAuth/Firebase only)
- Payment Reconciliation

## Complexity Weights (W5)

### Basic Integration → 5

### Auth / Payment / Webhook Integration → 7

### Complex Multi-Step Integration → 10

---

# 5. IMPORTANT ANALYSIS RULES

# Rule 1 — Evaluate ALL Categories

Every function MUST evaluate:

- C1
- C2
- C3
- C4
- C5

Do NOT stop after first match.

A function MAY belong to multiple categories.

---

# Rule 2 — Avoid Over-Classifying C4

Do NOT assign C4 automatically.

Only assign C4 when:

- persistent entities are central
- business records are managed
- transactional workflows exist

Examples likely needing C4:

- Manage Reservations
- Ticket Payment
- Movie Scheduling
- Manage Showtimes

Examples that MAY NOT need C4:

- View Movie Details
- Select Cinema
- Search Movies

---

# Rule 3 — Dashboard != Query

Dashboard/report functions are usually:

- C2
  AND SOMETIMES
- C3

Do not classify dashboards as only C3.

---

# Rule 4 — Payment Functions

Payment-related functions usually include:

- C1
- C4
- C5

Example:
Ticket Payment:

- C1/W1 = 1/6
- C4/W4 = 1/15
- C5/W5 = 1/7

---

# Rule 5 — Search Functions

Search/filter/list/detail functions are usually:

- C3

Sometimes:

- C4 if tightly coupled with core entities.

---

# Rule 6 — Authentication Functions

Simple login:

- C1 only

OAuth/Firebase/SSO login:

- C1 + C5

Do NOT assign C5 unless external auth exists.

---

# Rule 7 — Avoid Duplicate Meaning

Do NOT classify:

- simple output as both C2 and C3 unnecessarily
- simple CRUD as workflow transaction

Prefer minimal but correct classification.

---

# 6. EXAMPLES

# Search Movies

| Category | Value |
| -------- | ----- |
| C3       | 1     |
| W3       | 4     |

Reason:

- search/filter functionality

---

# Ticket Payment

| Category | Value |
| -------- | ----- |
| C1       | 1     |
| W1       | 6     |
| C4       | 1     |
| W4       | 15    |
| C5       | 1     |
| W5       | 7     |

Reason:

- transactional workflow
- uses Payment/Reservation entities
- integrates payment gateway

---

# Executive Dashboard

| Category | Value |
| -------- | ----- |
| C2       | 1     |
| W2       | 7     |
| C3       | 1     |
| W3       | 6     |

Reason:

- analytics/reporting output
- aggregated queries

---

# Manage Reservations

| Category | Value |
| -------- | ----- |
| C1       | 1     |
| W1       | 6     |
| C3       | 1     |
| W3       | 4     |
| C4       | 1     |
| W4       | 15    |

Reason:

- booking workflow
- reservation search/filter
- transactional entities

---

# Manage Genres

| Category | Value |
| -------- | ----- |
| C1       | 1     |
| W1       | 3     |
| C4       | 1     |
| W4       | 7     |

Reason:

- simple CRUD
- small entity

---

# 7. MARKDOWN UPDATE RULES

Update ONLY these columns:

- C1
- W1
- C2
- W2
- C3
- W3
- C4
- W4
- C5
- W5

DO NOT:

- add columns
- remove columns
- reorder rows
- modify formulas manually
- modify totals manually

For applicable categories:

- set Cx = 1
- set Wx = corresponding weight

Leave unrelated columns EMPTY.

NEVER use:

- 0
- N/A
- null

---

# 8. ROW PROCESSING RULES

A valid function row must contain:

- numeric STT
  AND
- non-empty function name

STOP processing when:

- STT column becomes empty
  OR
- row contains "Tổng"

Never write below totals section.

---

# 9. VALIDATION CHECKLIST

Before saving:

- all functions processed
- no invented functions
- no duplicate classifications
- no totals overwritten
- no markdown structure broken
- no accidental row shifts
- only valid columns updated

---

# 10. ESTIMATION PRINCIPLES

Prefer:

- deterministic classification
- evidence from controllers/services/schema
- realistic estimation
- conservative classification

Avoid:

- keyword-only classification
- hallucinated integrations
- overestimating dashboards
- assigning C4 everywhere
- assigning C5 without evidence

---

# 11. CONFIGURATION MANAGEMENT NOTE

The project includes concepts related to:

- version management
- release management
- workflow tracking
- configuration management
- traceability

These concepts MAY increase:

- workflow complexity
- integration complexity
- reporting complexity

ONLY apply these considerations if actual implementation evidence exists.
