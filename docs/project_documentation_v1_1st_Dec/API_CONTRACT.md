# 🎬 Movie Hub API Contract

> **Framework:** NestJS (TypeScript)  
> **API Style:** RESTful with URI Versioning (`/api/v{version}/...`)  
> **Authentication:** Clerk (JWT-based)  
> **Validation:** Zod Schemas via `nestjs-zod`  
> **Global Prefix:** `/api`  
> **Version Prefix:** `/v1`

---

## 📋 Table of Contents

1. [Standard Response Format](#standard-response-format)
2. [Authentication](#authentication)
3. [Enumerations Reference](#enumerations-reference)
4. [User Routes](#1-user-routes)
5. [Staff Routes](#2-staff-routes)
6. [Config Routes](#3-config-routes)
7. [Movie Routes](#4-movie-routes)
8. [Genre Routes](#5-genre-routes)
9. [Movie Release Routes](#6-movie-release-routes)
10. [Review Routes](#7-review-routes)
11. [Cinema Routes](#8-cinema-routes)
12. [Hall Routes](#9-hall-routes)
13. [Showtime Routes](#10-showtime-routes)
14. [Ticket Pricing Routes](#11-ticket-pricing-routes)
15. [Booking Routes](#12-booking-routes)
16. [Ticket Routes](#13-ticket-routes)
17. [Payment Routes](#14-payment-routes)
18. [Refund Routes](#15-refund-routes)
19. [Concession Routes](#16-concession-routes)
20. [Promotion Routes](#17-promotion-routes)
21. [Loyalty Routes](#18-loyalty-routes)
22. [WebSocket Events](#19-websocket-events)

---

## Standard Response Format

All API responses wrap data in a standard envelope:

### Success Response (2xx)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalRecords": 100,
    "totalPages": 10,
    "hasPrev": false,
    "hasNext": true
  },
  "message": "Optional success message",
  "timestamp": "2025-12-22T01:30:00.000Z",
  "path": "/api/v1/movies"
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Email is required" }],
  "timestamp": "2025-12-22T01:30:00.000Z",
  "path": "/api/v1/movies"
}
```

---

## Authentication

| Header          | Value                       | Description                      |
| --------------- | --------------------------- | -------------------------------- |
| `Authorization` | `Bearer <clerk_jwt_token>`  | Required for protected endpoints |
| `Cookie`        | `__session=<session_token>` | Alternative session cookie       |

**Guard:** `ClerkAuthGuard` - Validates JWT tokens from Clerk  
**Decorator:** `@CurrentUserId()` - Extracts authenticated user ID  
**Permission:** `@Permission("RESOURCE.ACTION")` - Role-based access control

---

## Enumerations Reference

### Booking Enums

| Enum                     | Values                                                                           |
| ------------------------ | -------------------------------------------------------------------------------- |
| `BookingStatus`          | `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `COMPLETED`                      |
| `PaymentStatus`          | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`                       |
| `PaymentMethod`          | `CREDIT_CARD`, `DEBIT_CARD`, `MOMO`, `ZALOPAY`, `VNPAY`, `BANK_TRANSFER`, `CASH` |
| `RefundStatus`           | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`                                   |
| `TicketStatus`           | `VALID`, `USED`, `CANCELLED`, `EXPIRED`                                          |
| `ConcessionCategory`     | `FOOD`, `DRINK`, `COMBO`, `MERCHANDISE`                                          |
| `PromotionType`          | `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_ITEM`, `POINTS`                              |
| `LoyaltyTransactionType` | `EARN`, `REDEEM`, `EXPIRE`                                                       |
| `LoyaltyTier`            | `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`                                           |

### Cinema Enums

| Enum             | Values                                                       |
| ---------------- | ------------------------------------------------------------ |
| `HallType`       | `STANDARD`, `VIP`, `IMAX`, `FOUR_DX`, `PREMIUM`              |
| `LayoutType`     | `STANDARD`, `DUAL_AISLE`, `STADIUM`                          |
| `SeatType`       | `STANDARD`, `VIP`, `COUPLE`, `PREMIUM`, `WHEELCHAIR`         |
| `SeatStatus`     | `ACTIVE`, `BROKEN`, `MAINTENANCE`                            |
| `Format`         | `TWO_D`, `THREE_D`, `IMAX`, `FOUR_DX`                        |
| `ShowtimeStatus` | `SCHEDULED`, `SELLING`, `SOLD_OUT`, `CANCELLED`, `COMPLETED` |

### Movie Enums

| Enum             | Values                             |
| ---------------- | ---------------------------------- |
| `AgeRating`      | `P`, `K`, `T13`, `T16`, `T18`, `C` |
| `LanguageOption` | `ORIGINAL`, `SUBTITLE`, `DUBBED`   |

### User/Staff Enums

| Enum            | Values                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Gender`        | `MALE`, `FEMALE`, `OTHER`                                                                                                  |
| `StaffStatus`   | `ACTIVE`, `INACTIVE`                                                                                                       |
| `WorkType`      | `FULL_TIME`, `PART_TIME`, `CONTRACT`                                                                                       |
| `StaffPosition` | `CINEMA_MANAGER`, `ASSISTANT_MANAGER`, `TICKET_CLERK`, `CONCESSION_STAFF`, `USHER`, `PROJECTIONIST`, `CLEANER`, `SECURITY` |
| `ShiftType`     | `MORNING`, `AFTERNOON`, `NIGHT`                                                                                            |

### Other Enums

| Enum                | Values                            |
| ------------------- | --------------------------------- |
| `DayType`           | `WEEKDAY`, `WEEKEND`, `HOLIDAY`   |
| `CinemaStatus`      | `ACTIVE`, `MAINTENANCE`, `CLOSED` |
| `HallStatus`        | `ACTIVE`, `MAINTENANCE`, `CLOSED` |
| `ReservationStatus` | `CONFIRMED`, `CANCELLED`          |
| `ReviewStatus`      | `ACTIVE`, `HIDDEN`, `DELETED`     |

---

## 1. User Routes

Base Path: `/api/users` (Note: No version prefix)

### `[GET] /api/users`

**Description:** Get list of all users  
**Auth:** Yes (ClerkAuthGuard)  
**Permission:** `USER.LIST`

**Request:** None

**Response Example (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_2abc...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |

---

## 2. Staff Routes

Base Path: `/api/v1/staffs`

### `[POST] /api/v1/staffs`

**Description:** Create a new staff member  
**Auth:** No (publicly accessible, should be secured in production)

**Request Body:**

| Field       | Type           | Required | Description                  |
| ----------- | -------------- | -------- | ---------------------------- |
| `cinemaId`  | string (UUID)  | Yes      | Associated cinema ID         |
| `fullName`  | string         | Yes      | Staff full name              |
| `email`     | string (email) | Yes      | Staff email                  |
| `phone`     | string         | Yes      | Phone number (min 9 chars)   |
| `gender`    | Gender         | Yes      | `MALE`, `FEMALE`, or `OTHER` |
| `dob`       | Date           | Yes      | Date of birth                |
| `position`  | StaffPosition  | Yes      | Job position                 |
| `status`    | StaffStatus    | Yes      | Employment status            |
| `workType`  | WorkType       | Yes      | Type of employment           |
| `shiftType` | ShiftType      | Yes      | Work shift                   |
| `salary`    | number         | Yes      | Monthly salary               |
| `hireDate`  | Date           | Yes      | Employment start date        |

**Request Example:**

```json
{
  "cinemaId": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "Nguyen Van A",
  "email": "nva@cinema.com",
  "phone": "0123456789",
  "gender": "MALE",
  "dob": "1995-05-15",
  "position": "TICKET_CLERK",
  "status": "ACTIVE",
  "workType": "FULL_TIME",
  "shiftType": "MORNING",
  "salary": 10000000,
  "hireDate": "2025-01-01"
}
```

**Response Example (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "staff_uuid",
    "cinemaId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Nguyen Van A",
    "email": "nva@cinema.com",
    ...
  }
}
```

---

### `[GET] /api/v1/staffs`

**Description:** Get list of staff with filters  
**Auth:** No

**Query Parameters:**

| Field       | Type          | Required | Description                  |
| ----------- | ------------- | -------- | ---------------------------- |
| `page`      | number        | No       | Page number (default: 1)     |
| `limit`     | number        | No       | Items per page (default: 10) |
| `cinemaId`  | string        | No       | Filter by cinema             |
| `fullName`  | string        | No       | Search by name               |
| `gender`    | Gender        | No       | Filter by gender             |
| `position`  | StaffPosition | No       | Filter by position           |
| `status`    | StaffStatus   | No       | Filter by status             |
| `workType`  | WorkType      | No       | Filter by work type          |
| `shiftType` | ShiftType     | No       | Filter by shift              |

---

### `[GET] /api/v1/staffs/:id`

**Description:** Get staff member by ID  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Staff ID    |

---

### `[PUT] /api/v1/staffs/:id`

**Description:** Update staff member  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Staff ID    |

**Request Body:** Same as POST but all fields optional, `cinemaId` and `email` cannot be changed

---

## 3. Config Routes

Base Path: `/api/v1/config`

### `[GET] /api/v1/config`

**Description:** Get all system configurations  
**Auth:** No

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "key": "max_seats_per_booking",
      "value": 8,
      "description": "Maximum seats per booking"
    }
  ]
}
```

---

### `[PUT] /api/v1/config/:key`

**Description:** Update a configuration value  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| `key`     | string | Configuration key |

**Request Body:**

| Field         | Type   | Required | Description          |
| ------------- | ------ | -------- | -------------------- |
| `key`         | string | Yes      | Configuration key    |
| `value`       | any    | Yes      | New value            |
| `description` | string | No       | Optional description |

---

## 4. Movie Routes

Base Path: `/api/v1/movies`

### `[GET] /api/v1/movies`

**Description:** Get list of movies with filters  
**Auth:** No

**Query Parameters:**

| Field       | Type            | Required | Description      |
| ----------- | --------------- | -------- | ---------------- |
| `page`      | number          | No       | Page number      |
| `limit`     | number          | No       | Items per page   |
| `status`    | string          | No       | Filter by status |
| `sortBy`    | string          | No       | Field to sort by |
| `sortOrder` | 'asc' \| 'desc' | No       | Sort direction   |

**Response Example (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "movie_uuid",
      "title": "Avengers: Endgame",
      "originalTitle": "Avengers: Endgame",
      "overview": "The epic conclusion...",
      "posterUrl": "https://...",
      "backdropUrl": "https://...",
      "trailerUrl": "https://...",
      "runtime": 181,
      "releaseDate": "2019-04-26",
      "ageRating": "T13",
      "genres": [{ "id": "...", "name": "Action" }]
    }
  ],
  "meta": { "page": 1, "limit": 10, ... }
}
```

---

### `[GET] /api/v1/movies/:id`

**Description:** Get movie details by ID  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Movie ID    |

---

### `[GET] /api/v1/movies/:id/releases`

**Description:** Get movie release schedule  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Movie ID    |

---

### `[POST] /api/v1/movies`

**Description:** Create a new movie  
**Auth:** No (should be admin-protected)

**Request Body:**

| Field               | Type            | Required | Description            |
| ------------------- | --------------- | -------- | ---------------------- |
| `title`             | string          | Yes      | Movie title            |
| `overview`          | string          | Yes      | Movie synopsis         |
| `originalTitle`     | string          | Yes      | Original title         |
| `posterUrl`         | string          | Yes      | Poster image URL       |
| `trailerUrl`        | string          | Yes      | Trailer video URL      |
| `backdropUrl`       | string          | Yes      | Backdrop image URL     |
| `runtime`           | number          | Yes      | Duration in minutes    |
| `releaseDate`       | Date            | Yes      | Release date           |
| `ageRating`         | AgeRating       | Yes      | Age restriction rating |
| `originalLanguage`  | string          | Yes      | Original language      |
| `spokenLanguages`   | string[]        | Yes      | Languages spoken       |
| `languageType`      | LanguageOption  | Yes      | Language option type   |
| `productionCountry` | string          | Yes      | Country of production  |
| `director`          | string          | Yes      | Director name          |
| `cast`              | CastMember[]    | Yes      | Cast members array     |
| `genreIds`          | string[] (UUID) | Yes      | Genre IDs              |

**Cast Member Object:**

```json
{
  "name": "Robert Downey Jr.",
  "character": "Tony Stark / Iron Man"
}
```

---

### `[PUT] /api/v1/movies/:id`

**Description:** Update movie details  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Movie ID    |

**Request Body:** Same as POST but all fields optional

---

### `[DELETE] /api/v1/movies/:id`

**Description:** Delete a movie  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Movie ID    |

**Response:** `null` on success

---

### `[GET] /api/v1/movies/:id/reviews`

**Description:** Get reviews for a movie  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Movie ID    |

**Query Parameters:**

| Field    | Type   | Required | Description      |
| -------- | ------ | -------- | ---------------- |
| `page`   | number | No       | Page number      |
| `limit`  | number | No       | Items per page   |
| `rating` | string | No       | Filter by rating |
| `userId` | string | No       | Filter by user   |

---

### `[POST] /api/v1/movies/:id/reviews`

**Description:** Create a review for a movie  
**Auth:** No (should be authenticated)

**Request Body:**

| Field     | Type          | Required | Description  |
| --------- | ------------- | -------- | ------------ |
| `movieId` | string (UUID) | Yes      | Movie ID     |
| `userId`  | string        | Yes      | User ID      |
| `rating`  | number (1-5)  | Yes      | Rating score |
| `content` | string        | Yes      | Review text  |

---

### `[PUT] /api/v1/movies/:id/reviews/:reviewId`

**Description:** Update a review  
**Auth:** No

**Path Parameters:**

| Parameter  | Type   | Description |
| ---------- | ------ | ----------- |
| `id`       | string | Movie ID    |
| `reviewId` | string | Review ID   |

---

## 5. Genre Routes

Base Path: `/api/v1/genres`

### `[GET] /api/v1/genres`

**Description:** Get all genres  
**Auth:** No

**Response Example:**

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Action" },
    { "id": "uuid", "name": "Comedy" }
  ]
}
```

---

### `[GET] /api/v1/genres/:id`

**Description:** Get genre by ID  
**Auth:** No

---

### `[POST] /api/v1/genres`

**Description:** Create a new genre  
**Auth:** No

**Request Body:**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| `name` | string | Yes      | Genre name  |

---

### `[PUT] /api/v1/genres/:id`

**Description:** Update genre  
**Auth:** No

**Request Body:** Same as POST

---

### `[DELETE] /api/v1/genres/:id`

**Description:** Delete genre  
**Auth:** No

---

## 6. Movie Release Routes

Base Path: `/api/v1/movie-releases`

### `[POST] /api/v1/movie-releases`

**Description:** Create a movie release schedule  
**Auth:** No

**Request Body:**

| Field       | Type          | Required | Description                      |
| ----------- | ------------- | -------- | -------------------------------- |
| `movieId`   | string (UUID) | No       | Movie ID                         |
| `startDate` | Date          | Yes      | Release start date               |
| `endDate`   | Date          | Yes      | Release end date                 |
| `note`      | string        | No       | Additional notes (max 500 chars) |

---

### `[PUT] /api/v1/movie-releases/:id`

**Description:** Update movie release  
**Auth:** No

---

### `[DELETE] /api/v1/movie-releases/:id`

**Description:** Delete movie release  
**Auth:** No

---

## 7. Review Routes

Base Path: `/api/v1/reviews`

### `[GET] /api/v1/reviews`

**Description:** Get all reviews with filters  
**Auth:** No

**Query Parameters:**

| Field     | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `page`    | number | No       | Page number      |
| `limit`   | number | No       | Items per page   |
| `rating`  | string | No       | Filter by rating |
| `userId`  | string | No       | Filter by user   |
| `movieId` | string | No       | Filter by movie  |

---

### `[DELETE] /api/v1/reviews/:id`

**Description:** Delete a review  
**Auth:** No

---

## 8. Cinema Routes

Base Path: `/api/v1/cinemas`

### `[GET] /api/v1/cinemas`

**Description:** Get all cinemas  
**Auth:** No

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cinema_uuid",
      "name": "CGV Vincom Center",
      "address": "191 Bà Triệu, Hai Bà Trưng",
      "city": "Hà Nội",
      "district": "Hai Bà Trưng",
      "phone": "024-1234-5678",
      "latitude": 21.0123,
      "longitude": 105.8456,
      "amenities": ["WIFI", "PARKING", "FOOD_COURT"],
      "images": ["https://..."]
    }
  ]
}
```

---

### `[GET] /api/v1/cinemas/:id`

**Description:** Get cinema details with optional distance calculation  
**Auth:** No

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Cinema ID   |

**Query Parameters:**

| Field | Type   | Required | Description      |
| ----- | ------ | -------- | ---------------- |
| `lat` | number | No       | User's latitude  |
| `lon` | number | No       | User's longitude |

---

### `[POST] /api/v1/cinemas/cinema`

**Description:** Create a new cinema  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field               | Type     | Required | Description                          |
| ------------------- | -------- | -------- | ------------------------------------ |
| `name`              | string   | Yes      | Cinema name (max 255)                |
| `address`           | string   | Yes      | Full address                         |
| `city`              | string   | Yes      | City name (max 100)                  |
| `district`          | string   | No       | District name (max 100)              |
| `phone`             | string   | No       | Phone number (max 20)                |
| `email`             | string   | No       | Email address (max 255)              |
| `website`           | string   | No       | Website URL                          |
| `latitude`          | number   | No       | Latitude coordinate                  |
| `longitude`         | number   | No       | Longitude coordinate                 |
| `description`       | string   | No       | Cinema description                   |
| `amenities`         | string[] | No       | List of amenities                    |
| `facilities`        | object   | No       | Facility details (JSON)              |
| `images`            | string[] | No       | Image URLs                           |
| `virtualTour360Url` | string   | No       | 360° tour URL                        |
| `operatingHours`    | object   | No       | Operating hours (JSON)               |
| `socialMedia`       | object   | No       | Social media links (JSON)            |
| `timezone`          | string   | No       | Timezone (default: Asia/Ho_Chi_Minh) |

---

### `[PATCH] /api/v1/cinemas/cinema/:cinemaId`

**Description:** Update cinema details  
**Auth:** Yes (ClerkAuthGuard)

**Path Parameters:**

| Parameter  | Type   | Description |
| ---------- | ------ | ----------- |
| `cinemaId` | string | Cinema ID   |

**Request Body:** Same as POST but all fields optional

---

### `[DELETE] /api/v1/cinemas/cinema/:cinemaId`

**Description:** Delete a cinema  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/cinemas/nearby`

**Description:** Get cinemas near user location  
**Auth:** No

**Query Parameters:**

| Field    | Type   | Required | Description                       |
| -------- | ------ | -------- | --------------------------------- |
| `lat`    | number | Yes      | Latitude                          |
| `lon`    | number | Yes      | Longitude                         |
| `radius` | number | No       | Search radius in km (default: 10) |
| `limit`  | number | No       | Max results (default: 20)         |

---

### `[GET] /api/v1/cinemas/search`

**Description:** Search cinemas by name/address  
**Auth:** No

**Query Parameters:**

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `query` | string | Yes      | Search term      |
| `lat`   | number | No       | User's latitude  |
| `lon`   | number | No       | User's longitude |

---

### `[GET] /api/v1/cinemas/filters`

**Description:** Get cinemas with advanced filters  
**Auth:** No

**Query Parameters:**

| Field       | Type                             | Required | Description                |
| ----------- | -------------------------------- | -------- | -------------------------- |
| `lat`       | number                           | No       | Latitude                   |
| `lon`       | number                           | No       | Longitude                  |
| `radius`    | number                           | No       | Radius in km               |
| `city`      | string                           | No       | Filter by city             |
| `district`  | string                           | No       | Filter by district         |
| `amenities` | string                           | No       | Comma-separated amenities  |
| `hallTypes` | string                           | No       | Comma-separated hall types |
| `minRating` | number                           | No       | Minimum rating             |
| `page`      | number                           | No       | Page number                |
| `limit`     | number                           | No       | Items per page             |
| `sortBy`    | 'distance' \| 'rating' \| 'name' | No       | Sort field                 |
| `sortOrder` | 'asc' \| 'desc'                  | No       | Sort direction             |

---

### `[GET] /api/v1/cinemas/locations/cities`

**Description:** Get list of available cities  
**Auth:** No

---

### `[GET] /api/v1/cinemas/locations/districts`

**Description:** Get districts by city  
**Auth:** No

**Query Parameters:**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| `city` | string | Yes      | City name   |

---

### `[GET] /api/v1/cinemas/:cinemaId/movies/:movieId/showtimes`

**Description:** Get showtimes for a movie at a specific cinema  
**Auth:** No

**Path Parameters:**

| Parameter  | Type   | Description |
| ---------- | ------ | ----------- |
| `cinemaId` | string | Cinema ID   |
| `movieId`  | string | Movie ID    |

**Query Parameters:**

| Field  | Type   | Required | Description                 |
| ------ | ------ | -------- | --------------------------- |
| `date` | string | Yes      | Date in `yyyy-MM-dd` format |

---

### `[GET] /api/v1/cinemas/:cinemaId/movies/:movieId/showtimes/admin`

**Description:** Admin view of movie showtimes with extra filters  
**Auth:** No (should be admin-protected)

**Query Parameters:**

| Field      | Type           | Required | Description                 |
| ---------- | -------------- | -------- | --------------------------- |
| `date`     | string         | Yes      | Date in `yyyy-MM-dd` format |
| `status`   | ShowtimeStatus | No       | Filter by status            |
| `format`   | Format         | No       | Filter by format            |
| `hallId`   | string         | No       | Filter by hall              |
| `language` | string         | No       | Filter by language          |

---

### `[GET] /api/v1/cinemas/cinema/:cinemaId/movies`

**Description:** Get all movies showing at a cinema  
**Auth:** No

**Path Parameters:**

| Parameter  | Type   | Description |
| ---------- | ------ | ----------- |
| `cinemaId` | string | Cinema ID   |

**Query Parameters:**

| Field   | Type   | Required | Description    |
| ------- | ------ | -------- | -------------- |
| `page`  | number | No       | Page number    |
| `limit` | number | No       | Items per page |

---

### `[GET] /api/v1/cinemas/movies/showtimes`

**Description:** Get all movies with their showtimes  
**Auth:** No

**Query Parameters:**

| Field  | Type   | Required | Description                 |
| ------ | ------ | -------- | --------------------------- |
| `date` | string | No       | Date in `yyyy-MM-dd` format |

---

## 9. Hall Routes

Base Path: `/api/v1/halls`

### `[GET] /api/v1/halls/hall/:hallId`

**Description:** Get hall by ID  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/halls/cinema/:cinemaId`

**Description:** Get all halls of a cinema  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/halls/hall`

**Description:** Create a new hall  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field         | Type          | Required | Description                     |
| ------------- | ------------- | -------- | ------------------------------- |
| `cinemaId`    | string (UUID) | Yes      | Cinema ID                       |
| `name`        | string        | Yes      | Hall name (max 100)             |
| `type`        | HallType      | Yes      | Hall type                       |
| `screenType`  | string        | No       | Screen type (max 50)            |
| `soundSystem` | string        | No       | Sound system (max 50)           |
| `features`    | string[]      | No       | Hall features                   |
| `layoutType`  | LayoutType    | No       | Layout type (default: STANDARD) |

---

### `[PATCH] /api/v1/halls/hall/:hallId`

**Description:** Update hall details  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:** Same as POST but all fields optional (except `layoutType` which cannot be changed)

---

### `[DELETE] /api/v1/halls/hall/:hallId`

**Description:** Delete a hall  
**Auth:** Yes (ClerkAuthGuard)

---

### `[PATCH] /api/v1/halls/seat/:seatId/status`

**Description:** Update seat status  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field    | Type       | Required | Description |
| -------- | ---------- | -------- | ----------- |
| `status` | SeatStatus | Yes      | New status  |

---

## 10. Showtime Routes

Base Path: `/api/v1/showtimes`

### `[GET] /api/v1/showtimes`

**Description:** Test endpoint  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/showtimes/:id/seats`

**Description:** Get seat layout for a showtime (includes real-time seat status)  
**Auth:** Yes (ClerkAuthGuard)

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Showtime ID |

**Response:** Seat grid with availability, held, and booked statuses

---

### `[GET] /api/v1/showtimes/showtime/:showtimeId/ttl`

**Description:** Get remaining session TTL for seat holding  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/showtimes/showtime`

**Description:** Create a new showtime  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field            | Type     | Required | Description                        |
| ---------------- | -------- | -------- | ---------------------------------- |
| `movieId`        | string   | Yes      | Movie ID                           |
| `movieReleaseId` | string   | Yes      | Movie release ID                   |
| `cinemaId`       | string   | Yes      | Cinema ID                          |
| `hallId`         | string   | Yes      | Hall ID                            |
| `startTime`      | string   | Yes      | Start time (`yyyy-MM-dd HH:mm:ss`) |
| `format`         | Format   | No       | Showtime format (default: TWO_D)   |
| `language`       | string   | Yes      | Language (max 10 chars)            |
| `subtitles`      | string[] | No       | Subtitle languages                 |

---

### `[POST] /api/v1/showtimes/batch`

**Description:** Create multiple showtimes at once  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field            | Type                                     | Required | Description                |
| ---------------- | ---------------------------------------- | -------- | -------------------------- |
| `movieId`        | string                                   | Yes      | Movie ID                   |
| `movieReleaseId` | string                                   | Yes      | Movie release ID           |
| `cinemaId`       | string                                   | Yes      | Cinema ID                  |
| `hallId`         | string                                   | Yes      | Hall ID                    |
| `startDate`      | string                                   | Yes      | Start date (`yyyy-MM-dd`)  |
| `endDate`        | string                                   | Yes      | End date (`yyyy-MM-dd`)    |
| `timeSlots`      | string[]                                 | Yes      | Time slots (`HH:mm`)       |
| `repeatType`     | 'DAILY' \| 'WEEKLY' \| 'CUSTOM_WEEKDAYS' | Yes      | Repeat pattern             |
| `weekdays`       | number[]                                 | No       | Weekdays (0-6 for Sun-Sat) |
| `format`         | Format                                   | No       | Format (default: TWO_D)    |
| `language`       | string                                   | Yes      | Language                   |
| `subtitles`      | string[]                                 | No       | Subtitles                  |

---

### `[PATCH] /api/v1/showtimes/showtime/:id`

**Description:** Update showtime  
**Auth:** Yes (ClerkAuthGuard)

---

### `[DELETE] /api/v1/showtimes/showtime/:id`

**Description:** Delete showtime  
**Auth:** Yes (ClerkAuthGuard)

---

## 11. Ticket Pricing Routes

Base Path: `/api/v1/ticket-pricings`

### `[GET] /api/v1/ticket-pricings/hall/:hallId`

**Description:** Get ticket pricing for a hall  
**Auth:** No

---

### `[PATCH] /api/v1/ticket-pricings/pricing/:pricingId`

**Description:** Update ticket pricing  
**Auth:** No

**Request Body:**

| Field   | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| `price` | number | Yes      | New price   |

---

## 12. Booking Routes

Base Path: `/api/v1/bookings`

### `[POST] /api/v1/bookings`

**Description:** Create a new booking (seats come from Redis hold session)  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type                | Required | Description                      |
| --------------- | ------------------- | -------- | -------------------------------- |
| `showtimeId`    | string              | Yes      | Showtime ID                      |
| `seats`         | SeatBookingDto[]    | No       | Optional ticket type assignments |
| `concessions`   | ConcessionItemDto[] | No       | Concession items                 |
| `promotionCode` | string              | No       | Promotion code                   |
| `usePoints`     | number              | No       | Loyalty points to redeem         |
| `customerInfo`  | CustomerInfoDto     | No       | Fallback customer info           |

**SeatBookingDto:**

```json
{
  "seatId": "seat_uuid",
  "ticketType": "ADULT"
}
```

**ConcessionItemDto:**

```json
{
  "concessionId": "concession_uuid",
  "quantity": 2
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "booking_uuid",
    "userId": "user_id",
    "showtimeId": "showtime_uuid",
    "status": "PENDING",
    "totalAmount": 350000,
    "discountAmount": 0,
    "finalAmount": 350000,
    "expiresAt": "2025-12-22T02:00:00.000Z",
    "tickets": [...],
    "concessions": [...]
  }
}
```

---

### `[GET] /api/v1/bookings`

**Description:** Get current user's bookings  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field    | Type          | Required | Description      |
| -------- | ------------- | -------- | ---------------- |
| `status` | BookingStatus | No       | Filter by status |
| `page`   | number        | No       | Page number      |
| `limit`  | number        | No       | Items per page   |

---

### `[GET] /api/v1/bookings/:id`

**Description:** Get booking details  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/bookings/:id/summary`

**Description:** Get booking summary  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/bookings/:id/cancel`

**Description:** Cancel a booking  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field    | Type   | Required | Description         |
| -------- | ------ | -------- | ------------------- |
| `reason` | string | No       | Cancellation reason |

---

### `[GET] /api/v1/bookings/showtime/:showtimeId/check`

**Description:** Check if user has existing booking for a showtime  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field             | Type   | Required | Description                         |
| ----------------- | ------ | -------- | ----------------------------------- |
| `includeStatuses` | string | No       | Comma-separated statuses to include |

---

### `[PUT] /api/v1/bookings/:id`

**Description:** Update booking (before payment)  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type               | Required | Description             |
| --------------- | ------------------ | -------- | ----------------------- |
| `seats`         | SeatUpdate[]       | No       | Updated seat selections |
| `concessions`   | ConcessionUpdate[] | No       | Updated concessions     |
| `promotionCode` | string             | No       | New promotion code      |
| `usePoints`     | number             | No       | Points to use           |

---

### `[POST] /api/v1/bookings/:id/reschedule`

**Description:** Reschedule booking to different showtime  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type   | Required | Description       |
| --------------- | ------ | -------- | ----------------- |
| `newShowtimeId` | string | Yes      | New showtime ID   |
| `reason`        | string | No       | Reschedule reason |

---

### `[GET] /api/v1/bookings/:id/refund-calculation`

**Description:** Calculate potential refund amount  
**Auth:** Yes (ClerkAuthGuard)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "canRefund": true,
    "refundAmount": 280000,
    "refundPercentage": 80,
    "ticketAmount": 300000,
    "concessionsAmount": 50000,
    "reason": "Refund available: 80% within 24 hours",
    "deadline": "2025-12-22T18:00:00.000Z"
  }
}
```

---

### `[POST] /api/v1/bookings/:id/cancel-with-refund`

**Description:** Cancel booking and request refund  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type    | Required | Description               |
| --------------- | ------- | -------- | ------------------------- |
| `reason`        | string  | No       | Cancellation reason       |
| `requestRefund` | boolean | Yes      | Whether to request refund |

---

### `[GET] /api/v1/bookings/cancellation-policy`

**Description:** Get cancellation policy  
**Auth:** No

---

### Admin Booking Endpoints

### `[GET] /api/v1/bookings/admin/all`

**Description:** Admin: Get all bookings with filters  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field           | Type                                           | Required | Description              |
| --------------- | ---------------------------------------------- | -------- | ------------------------ |
| `userId`        | string                                         | No       | Filter by user           |
| `showtimeId`    | string                                         | No       | Filter by showtime       |
| `cinemaId`      | string                                         | No       | Filter by cinema         |
| `status`        | BookingStatus                                  | No       | Filter by status         |
| `paymentStatus` | PaymentStatus                                  | No       | Filter by payment status |
| `startDate`     | Date                                           | No       | Start date range         |
| `endDate`       | Date                                           | No       | End date range           |
| `sortBy`        | 'created_at' \| 'final_amount' \| 'expires_at' | No       | Sort field               |
| `page`          | number                                         | No       | Page number              |
| `limit`         | number                                         | No       | Items per page           |

---

### `[GET] /api/v1/bookings/admin/showtime/:showtimeId`

**Description:** Admin: Get bookings by showtime  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field    | Type          | Required | Description      |
| -------- | ------------- | -------- | ---------------- |
| `status` | BookingStatus | No       | Filter by status |

---

### `[GET] /api/v1/bookings/admin/date-range`

**Description:** Admin: Get bookings by date range  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field       | Type          | Required | Description      |
| ----------- | ------------- | -------- | ---------------- |
| `startDate` | Date          | Yes      | Start date       |
| `endDate`   | Date          | Yes      | End date         |
| `status`    | BookingStatus | No       | Filter by status |
| `page`      | number        | No       | Page number      |
| `limit`     | number        | No       | Items per page   |

---

### `[PUT] /api/v1/bookings/admin/:id/status`

**Description:** Admin: Update booking status  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field    | Type          | Required | Description          |
| -------- | ------------- | -------- | -------------------- |
| `status` | BookingStatus | Yes      | New status           |
| `reason` | string        | No       | Status change reason |

---

### `[POST] /api/v1/bookings/admin/:id/confirm`

**Description:** Admin: Confirm a pending booking  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/bookings/admin/:id/complete`

**Description:** Admin: Mark booking as completed  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/bookings/admin/:id/expire`

**Description:** Admin: Manually expire a booking  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/bookings/admin/statistics`

**Description:** Admin: Get booking statistics  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field        | Type                                              | Required | Description        |
| ------------ | ------------------------------------------------- | -------- | ------------------ |
| `startDate`  | Date                                              | No       | Start date         |
| `endDate`    | Date                                              | No       | End date           |
| `cinemaId`   | string                                            | No       | Filter by cinema   |
| `showtimeId` | string                                            | No       | Filter by showtime |
| `groupBy`    | 'day' \| 'week' \| 'month' \| 'cinema' \| 'movie' | No       | Grouping           |

---

### `[GET] /api/v1/bookings/admin/revenue-report`

**Description:** Admin: Get revenue report  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field       | Type                                   | Required | Description      |
| ----------- | -------------------------------------- | -------- | ---------------- |
| `startDate` | Date                                   | Yes      | Start date       |
| `endDate`   | Date                                   | Yes      | End date         |
| `cinemaId`  | string                                 | No       | Filter by cinema |
| `groupBy`   | 'day' \| 'week' \| 'month' \| 'cinema' | No       | Grouping         |

---

## 13. Ticket Routes

Base Path: `/api/v1/tickets`

### `[GET] /api/v1/tickets/:id`

**Description:** Get ticket details  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/tickets/code/:ticketCode`

**Description:** Get ticket by ticket code  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/tickets/:id/validate`

**Description:** Validate ticket for entry (staff use)  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field            | Type   | Required | Description     |
| ---------------- | ------ | -------- | --------------- |
| `validationCode` | string | No       | Validation code |
| `cinemaId`       | string | No       | Cinema ID       |

---

### `[POST] /api/v1/tickets/:id/use`

**Description:** Mark ticket as used  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/tickets/:id/qr`

**Description:** Generate QR code for ticket  
**Auth:** Yes (ClerkAuthGuard)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

---

### Admin Ticket Endpoints

### `[GET] /api/v1/tickets/admin/all`

**Description:** Admin: Get all tickets  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field        | Type         | Required | Description        |
| ------------ | ------------ | -------- | ------------------ |
| `bookingId`  | string       | No       | Filter by booking  |
| `showtimeId` | string       | No       | Filter by showtime |
| `status`     | TicketStatus | No       | Filter by status   |
| `startDate`  | Date         | No       | Start date         |
| `endDate`    | Date         | No       | End date           |
| `page`       | number       | No       | Page number        |
| `limit`      | number       | No       | Items per page     |

---

### `[GET] /api/v1/tickets/admin/showtime/:showtimeId`

**Description:** Admin: Get tickets by showtime  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/tickets/admin/booking/:bookingId`

**Description:** Admin: Get tickets by booking  
**Auth:** Yes (ClerkAuthGuard)

---

### `[POST] /api/v1/tickets/admin/bulk-validate`

**Description:** Admin: Bulk validate tickets  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field       | Type     | Required | Description         |
| ----------- | -------- | -------- | ------------------- |
| `ticketIds` | string[] | Yes      | Array of ticket IDs |
| `cinemaId`  | string   | No       | Cinema ID           |

---

### `[PUT] /api/v1/tickets/admin/:id/cancel`

**Description:** Admin: Cancel a ticket  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field    | Type   | Required | Description         |
| -------- | ------ | -------- | ------------------- |
| `reason` | string | No       | Cancellation reason |

---

## 14. Payment Routes

Base Path: `/api/v1/payments`

### `[POST] /api/v1/payments/bookings/:bookingId`

**Description:** Create payment for a booking  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type          | Required | Description              |
| --------------- | ------------- | -------- | ------------------------ |
| `paymentMethod` | PaymentMethod | No       | Payment method           |
| `amount`        | number        | No       | Payment amount           |
| `returnUrl`     | string        | No       | Return URL after payment |
| `cancelUrl`     | string        | No       | Cancel URL               |

**Response Example (VNPay):**

```json
{
  "success": true,
  "data": {
    "paymentId": "payment_uuid",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/...",
    "amount": 350000,
    "transactionRef": "TXN_123456"
  }
}
```

---

### `[GET] /api/v1/payments/:id`

**Description:** Get payment details  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/payments/booking/:bookingId`

**Description:** Get payments for a booking  
**Auth:** Yes (ClerkAuthGuard)

---

### VNPay Webhook Endpoints (PUBLIC)

### `[GET] /api/v1/payments/vnpay/ipn`

**Description:** VNPay IPN callback (Instant Payment Notification)  
**Auth:** No (Public webhook)

**Query Parameters:** VNPay standard parameters

**Response:** Raw JSON (not wrapped)

```json
{
  "RspCode": "00",
  "Message": "Success"
}
```

---

### `[GET] /api/v1/payments/vnpay/return`

**Description:** VNPay return URL (user redirect after payment)  
**Auth:** No (Public)

**Query Parameters:** VNPay standard parameters

---

### Admin Payment Endpoints

### `[GET] /api/v1/payments/admin/all`

**Description:** Admin: Get all payments  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field           | Type                                  | Required | Description       |
| --------------- | ------------------------------------- | -------- | ----------------- |
| `bookingId`     | string                                | No       | Filter by booking |
| `status`        | PaymentStatus                         | No       | Filter by status  |
| `paymentMethod` | string                                | No       | Filter by method  |
| `startDate`     | Date                                  | No       | Start date        |
| `endDate`       | Date                                  | No       | End date          |
| `sortBy`        | 'created_at' \| 'amount' \| 'paid_at' | No       | Sort field        |
| `page`          | number                                | No       | Page number       |
| `limit`         | number                                | No       | Items per page    |

---

### `[GET] /api/v1/payments/admin/status/:status`

**Description:** Admin: Get payments by status  
**Auth:** Yes (ClerkAuthGuard)

**Path Parameters:**

| Parameter | Type          | Description    |
| --------- | ------------- | -------------- |
| `status`  | PaymentStatus | Payment status |

**Query Parameters:**

| Field   | Type   | Required | Description                  |
| ------- | ------ | -------- | ---------------------------- |
| `page`  | number | No       | Page number (default: 1)     |
| `limit` | number | No       | Items per page (default: 10) |

---

### `[PUT] /api/v1/payments/admin/:id/cancel`

**Description:** Admin: Cancel a payment  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/payments/admin/statistics`

**Description:** Admin: Get payment statistics  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field           | Type   | Required | Description      |
| --------------- | ------ | -------- | ---------------- |
| `startDate`     | string | No       | Start date (ISO) |
| `endDate`       | string | No       | End date (ISO)   |
| `paymentMethod` | string | No       | Filter by method |

---

## 15. Refund Routes

Base Path: `/api/v1/refunds`

### `[POST] /api/v1/refunds`

**Description:** Create a refund request  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field       | Type   | Required | Description   |
| ----------- | ------ | -------- | ------------- |
| `paymentId` | string | Yes      | Payment ID    |
| `amount`    | number | Yes      | Refund amount |
| `reason`    | string | Yes      | Refund reason |

---

### `[GET] /api/v1/refunds`

**Description:** Get refunds with filters  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field       | Type         | Required | Description       |
| ----------- | ------------ | -------- | ----------------- |
| `paymentId` | string       | No       | Filter by payment |
| `status`    | RefundStatus | No       | Filter by status  |
| `startDate` | Date         | No       | Start date        |
| `endDate`   | Date         | No       | End date          |
| `page`      | number       | No       | Page number       |
| `limit`     | number       | No       | Items per page    |

---

### `[GET] /api/v1/refunds/:id`

**Description:** Get refund details  
**Auth:** Yes (ClerkAuthGuard)

---

### `[GET] /api/v1/refunds/payment/:paymentId`

**Description:** Get refunds for a payment  
**Auth:** Yes (ClerkAuthGuard)

---

### `[PUT] /api/v1/refunds/:id/process`

**Description:** Process a pending refund  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field      | Type   | Required | Description                     |
| ---------- | ------ | -------- | ------------------------------- |
| `refundId` | string | Yes      | Refund ID (path param included) |

---

### `[PUT] /api/v1/refunds/:id/approve`

**Description:** Approve a refund  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field      | Type   | Required | Description   |
| ---------- | ------ | -------- | ------------- |
| `refundId` | string | Yes      | Refund ID     |
| `note`     | string | No       | Approval note |

---

### `[PUT] /api/v1/refunds/:id/reject`

**Description:** Reject a refund  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field      | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `refundId` | string | Yes      | Refund ID        |
| `reason`   | string | Yes      | Rejection reason |

---

## 16. Concession Routes

Base Path: `/api/v1/concessions`

### `[GET] /api/v1/concessions`

**Description:** Get all concessions  
**Auth:** No

**Query Parameters:**

| Field       | Type               | Required | Description            |
| ----------- | ------------------ | -------- | ---------------------- |
| `cinemaId`  | string             | No       | Filter by cinema       |
| `category`  | ConcessionCategory | No       | Filter by category     |
| `available` | 'true' \| 'false'  | No       | Filter by availability |

---

### `[GET] /api/v1/concessions/:id`

**Description:** Get concession details  
**Auth:** No

---

### `[POST] /api/v1/concessions`

**Description:** Create a new concession  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type               | Required | Description           |
| --------------- | ------------------ | -------- | --------------------- |
| `name`          | string             | Yes      | Concession name       |
| `nameEn`        | string             | No       | English name          |
| `description`   | string             | No       | Description           |
| `category`      | ConcessionCategory | Yes      | Category              |
| `price`         | number             | Yes      | Price                 |
| `imageUrl`      | string             | No       | Image URL             |
| `available`     | boolean            | No       | Availability          |
| `inventory`     | number             | No       | Stock quantity        |
| `cinemaId`      | string             | No       | Cinema ID             |
| `nutritionInfo` | object             | No       | Nutrition info (JSON) |
| `allergens`     | string[]           | No       | Allergen list         |

---

### `[PUT] /api/v1/concessions/:id`

**Description:** Update concession  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:** Same as POST but all fields optional

---

### `[DELETE] /api/v1/concessions/:id`

**Description:** Delete concession  
**Auth:** Yes (ClerkAuthGuard)

---

### `[PATCH] /api/v1/concessions/:id/inventory`

**Description:** Update concession inventory  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field      | Type   | Required | Description            |
| ---------- | ------ | -------- | ---------------------- |
| `quantity` | number | Yes      | New inventory quantity |

---

## 17. Promotion Routes

Base Path: `/api/v1/promotions`

### `[GET] /api/v1/promotions`

**Description:** Get all promotions  
**Auth:** No

**Query Parameters:**

| Field    | Type              | Required | Description             |
| -------- | ----------------- | -------- | ----------------------- |
| `active` | 'true' \| 'false' | No       | Filter by active status |
| `type`   | PromotionType     | No       | Filter by type          |

---

### `[GET] /api/v1/promotions/:id`

**Description:** Get promotion details  
**Auth:** No

---

### `[GET] /api/v1/promotions/code/:code`

**Description:** Get promotion by code  
**Auth:** No

---

### `[POST] /api/v1/promotions/validate/:code`

**Description:** Validate a promotion code  
**Auth:** No

**Request Body:**

| Field           | Type                       | Required | Description          |
| --------------- | -------------------------- | -------- | -------------------- |
| `bookingAmount` | number                     | Yes      | Booking total amount |
| `items`         | ValidatePromotionItemDto[] | No       | Items to check       |

**ValidatePromotionItemDto:**

```json
{
  "type": "ticket",
  "id": "item_uuid",
  "quantity": 2
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountAmount": 50000,
    "discountPercentage": 10,
    "message": "Promotion applied successfully"
  }
}
```

---

### `[POST] /api/v1/promotions`

**Description:** Create a new promotion  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type          | Required | Description           |
| --------------- | ------------- | -------- | --------------------- |
| `code`          | string        | Yes      | Promotion code        |
| `name`          | string        | Yes      | Promotion name        |
| `description`   | string        | No       | Description           |
| `type`          | PromotionType | Yes      | Promotion type        |
| `value`         | number        | Yes      | Discount value        |
| `minPurchase`   | number        | No       | Minimum purchase      |
| `maxDiscount`   | number        | No       | Maximum discount      |
| `validFrom`     | Date          | Yes      | Start date            |
| `validTo`       | Date          | Yes      | End date              |
| `usageLimit`    | number        | No       | Total usage limit     |
| `usagePerUser`  | number        | No       | Per-user limit        |
| `applicableFor` | string[]      | No       | Applicable items      |
| `conditions`    | object        | No       | Additional conditions |
| `active`        | boolean       | No       | Active status         |

---

### `[PUT] /api/v1/promotions/:id`

**Description:** Update promotion  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:** Same as POST but all fields optional

---

### `[DELETE] /api/v1/promotions/:id`

**Description:** Delete promotion  
**Auth:** Yes (ClerkAuthGuard)

---

### `[PATCH] /api/v1/promotions/:id/toggle-active`

**Description:** Toggle promotion active status  
**Auth:** Yes (ClerkAuthGuard)

---

## 18. Loyalty Routes

Base Path: `/api/v1/loyalty`

### `[GET] /api/v1/loyalty/balance`

**Description:** Get user's loyalty balance and tier  
**Auth:** Yes (ClerkAuthGuard)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "balance": 5000,
    "tier": "SILVER",
    "lifetimePoints": 25000,
    "nextTier": "GOLD",
    "pointsToNextTier": 5000
  }
}
```

---

### `[GET] /api/v1/loyalty/transactions`

**Description:** Get loyalty transaction history  
**Auth:** Yes (ClerkAuthGuard)

**Query Parameters:**

| Field   | Type                   | Required | Description                  |
| ------- | ---------------------- | -------- | ---------------------------- |
| `type`  | LoyaltyTransactionType | No       | Filter by type               |
| `page`  | number                 | No       | Page number (default: 1)     |
| `limit` | number                 | No       | Items per page (default: 10) |

---

### `[POST] /api/v1/loyalty/earn`

**Description:** Earn loyalty points  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type   | Required | Description            |
| --------------- | ------ | -------- | ---------------------- |
| `points`        | number | Yes      | Points to earn         |
| `transactionId` | string | No       | Associated transaction |
| `description`   | string | No       | Description            |

---

### `[POST] /api/v1/loyalty/redeem`

**Description:** Redeem loyalty points  
**Auth:** Yes (ClerkAuthGuard)

**Request Body:**

| Field           | Type   | Required | Description            |
| --------------- | ------ | -------- | ---------------------- |
| `points`        | number | Yes      | Points to redeem       |
| `transactionId` | string | No       | Associated transaction |
| `description`   | string | No       | Description            |

---

## 19. WebSocket Events

**Namespace:** `/` (default)  
**Protocol:** Socket.IO with Redis Adapter  
**Authentication:** Clerk JWT via middleware

### Connection

```javascript
// Connect with auth token and showtime context
const socket = io('http://localhost:3000', {
  auth: { token: 'clerk_jwt_token' },
  query: { showtimeId: 'showtime_uuid' },
});
```

### Client → Server Events

| Event          | Payload         | Description            |
| -------------- | --------------- | ---------------------- |
| `hold_seat`    | `SeatActionDto` | Request to hold a seat |
| `release_seat` | `SeatActionDto` | Release a held seat    |

**SeatActionDto:**

```json
{
  "showtimeId": "showtime_uuid",
  "seatId": "seat_uuid"
}
```

### Server → Client Events

| Event           | Payload             | Description                   |
| --------------- | ------------------- | ----------------------------- |
| `seat_held`     | `SeatEvent`         | A seat was held by someone    |
| `seat_released` | `SeatEvent`         | A seat was released           |
| `seat_expired`  | `SeatExpiredEvent`  | A seat hold expired           |
| `seat_booked`   | `SeatBookingEvent`  | A seat was permanently booked |
| `limit_reached` | `LimitReachedEvent` | User reached seat hold limit  |

**SeatEvent:**

```json
{
  "showtimeId": "showtime_uuid",
  "seatId": "seat_uuid",
  "userId": "user_id"
}
```

**SeatExpiredEvent:**

```json
{
  "showtimeId": "showtime_uuid",
  "seatIds": ["seat_1", "seat_2"],
  "userId": "user_id"
}
```

**LimitReachedEvent:**

```json
{
  "showtimeId": "showtime_uuid",
  "userId": "user_id",
  "maxSeats": 8
}
```

---

## Error Codes Reference

| Code | Description                                  |
| ---- | -------------------------------------------- |
| 400  | Bad Request - Invalid input data             |
| 401  | Unauthorized - Missing or invalid auth token |
| 403  | Forbidden - Insufficient permissions         |
| 404  | Not Found - Resource doesn't exist           |
| 409  | Conflict - Resource state conflict           |
| 422  | Unprocessable Entity - Validation failed     |
| 429  | Too Many Requests - Rate limit exceeded      |
| 500  | Internal Server Error                        |

---

## Version History

| Version | Date       | Description          |
| ------- | ---------- | -------------------- |
| 1.0.0   | 2025-12-22 | Initial API Contract |

---

_Generated by AI Backend Analysis Tool_
