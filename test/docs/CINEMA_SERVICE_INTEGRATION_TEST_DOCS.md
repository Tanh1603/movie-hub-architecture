# Cinema Service - Integration Test Documentation

> **Purpose:** This document serves as the source of truth for writing Integration Tests for the Cinema Service microservice.
>
> **Service:** `cinema-service`
> **Protocol:** TCP Microservice (NestJS `@MessagePattern`)
> **Database:** PostgreSQL (via Prisma ORM)
> **Caching:** Redis (via `RedisPubSubService`)

---

## Table of Contents

1. [Cinema Module](#1-cinema-module)
   - [createCinema](#11-createcinema)
   - [updateCinema](#12-updatecinema)
   - [deleteCinema](#13-deletecinema)
   - [getAllCinemas](#14-getallcinemas)
   - [getMoviesByCinema](#15-getmoviesbycinema)
   - [getAllMoviesWithShowtimes](#16-getallmovieswithshowtimes)
2. [Cinema Location Module](#2-cinema-location-module)
   - [getCinemasNearby](#21-getcinemasnearby)
   - [getCinemasWithFilters](#22-getcinemasswithfilters)
   - [getCinemaDetail](#23-getcinemadetail)
   - [searchCinemas](#24-searchcinemas)
   - [getAvailableCities](#25-getavailablecities)
   - [getAvailableDistricts](#26-getavailabledistricts)
3. [Showtime Module](#3-showtime-module)
   - [getShowtimes](#31-getshowtimes)
   - [getShowtimeById](#32-getshowtimebyid)
   - [getMovieShowtimesAtCinema](#33-getmovieshowstimesatcinema)
   - [adminGetMovieShowtimes](#34-admingetmovieshowstimes)
   - [getShowtimeSeats](#35-getshowtimeseats)
   - [getSeatsHeldByUser](#36-getseatsheldbyuser)
   - [getSessionTTL](#37-getsessionttl)
   - [createShowtime](#38-createshowtime)
   - [batchCreateShowtimes](#39-batchcreateshowtimes)
   - [updateShowtime](#310-updateshowtime)
   - [cancelShowtime](#311-cancelshowtime)
4. [Hall Module](#4-hall-module)
   - [getHallDetail](#41-gethalldetail)
   - [getHallsOfCinema](#42-gethallsofcinema)
   - [createHall](#43-createhall)
   - [updateHall](#44-updatehall)
   - [deleteHall](#45-deletehall)
   - [updateSeatStatus](#46-updateseatstatus)
5. [Realtime Module (Seat Hold Management)](#5-realtime-module-seat-hold-management)

---

## 1. Cinema Module

### 1.1 createCinema

**Summary:** Creates a new cinema record in the database.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `name` | `string` | ✅ | Max 255 chars (`@db.VarChar(255)`) |
| `address` | `string` | ✅ | - |
| `city` | `string` | ✅ | Max 100 chars |
| `district` | `string` | ❌ | Max 100 chars |
| `phone` | `string` | ❌ | Max 20 chars |
| `email` | `string` | ❌ | Max 255 chars |
| `website` | `string` | ❌ | Max 255 chars |
| `latitude` | `Decimal` | ❌ | Precision(10,8) |
| `longitude` | `Decimal` | ❌ | Precision(11,8) |
| `description` | `string` | ❌ | - |
| `amenities` | `string[]` | ❌ | Array of strings |
| `facilities` | `JSON` | ❌ | - |
| `images` | `string[]` | ❌ | Array of image URLs |
| `virtualTour360Url` | `string` | ❌ | Max 500 chars |
| `status` | `CinemaStatusEnum` | ❌ | `ACTIVE` \| `MAINTENANCE` \| `CLOSED` |

**Output (Success):**
```typescript
{
  data: CinemaDetailResponse,
  message: 'Create cinema successfully!'
}
```

```typescript
interface CinemaDetailResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities: string[];
  facilities?: object;
  images: string[];
  virtualTour360Url?: string;
  rating?: number;
  totalReviews: number;
  operatingHours?: object;
  socialMedia?: object;
  status: CinemaStatusEnum;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Requires active PostgreSQL connection. Mock `prisma.cinemas.create()` |
| `Cinemas` table | DB Table | Insert test data for validation |

#### Side Effects & State Changes

- ✅ **Creates** a new row in the `Cinemas` table
- ✅ `created_at` and `updated_at` are auto-populated with current timestamp
- ✅ Default `status` is `ACTIVE` if not provided
- ✅ Default `timezone` is `Asia/Ho_Chi_Minh`

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Create cinema with all required fields | ✅ Success | Returns `CinemaDetailResponse` with generated UUID |
| Create cinema with optional fields (amenities, facilities) | ✅ Success | All fields persisted correctly |
| Create cinema with missing `name` | ❌ Failure | Validation error (400) |
| Create cinema with missing `address` | ❌ Failure | Validation error (400) |
| Create cinema with invalid `latitude` (out of range) | ❌ Failure | Database constraint error |

**Error Codes/Exceptions:**
- `BadRequestException` - Missing required fields
- `PrismaClientKnownRequestError` - Database constraints violated

---

### 1.2 updateCinema

**Summary:** Updates an existing cinema record by ID.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |
| `updateCinemaRequest` | `UpdateCinemaRequest` | ✅ | Partial of CreateCinemaRequest |

**Output (Success):**
```typescript
{
  data: CinemaDetailResponse,
  message: 'Update cinema successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.cinemas.findUnique()` and `prisma.cinemas.update()` |
| `Cinemas` table | DB Table | Pre-seed test cinema for update |

#### Side Effects & State Changes

- ✅ **Updates** existing row in `Cinemas` table
- ✅ `updated_at` is refreshed to current timestamp

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Update cinema name successfully | ✅ Success | Returns updated `CinemaDetailResponse` |
| Update cinema status to `MAINTENANCE` | ✅ Success | Status field updated |
| Update non-existent cinema | ❌ Failure | `ResourceNotFoundException` (404) |
| Update with invalid UUID format | ❌ Failure | Validation error (400) |

**Error Codes/Exceptions:**
- `ResourceNotFoundException` - Cinema not found (404)

---

### 1.3 deleteCinema

**Summary:** Deletes a cinema record by ID. Fails if cinema has related halls or showtimes.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |

**Output (Success):**
```typescript
{
  data: undefined,
  message: 'Delete cinema successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.cinemas.delete()` |
| `Halls` table | DB Table | FK relationship - must be empty |
| `Showtimes` table | DB Table | FK relationship - must be empty |

#### Side Effects & State Changes

- ✅ **Deletes** row from `Cinemas` table
- ⚠️ **Cascade**: If ON DELETE CASCADE is configured, related Halls/Showtimes are also deleted

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Delete cinema with no dependencies | ✅ Success | Cinema removed from DB |
| Delete cinema with existing halls | ❌ Failure | `CINEMA_IN_USE` (400) |
| Delete cinema with existing showtimes | ❌ Failure | `CINEMA_IN_USE` (400) |
| Delete non-existent cinema | ❌ Failure | `CINEMA_NOT_FOUND` (404) |

**Error Codes/Exceptions:**
- `CINEMA_NOT_FOUND` (404) - Prisma error code `P2025`
- `CINEMA_IN_USE` (400) - Prisma error code `P2003` (FK constraint)
- `DELETE_CINEMA_FAILED` (500) - Unexpected error

---

### 1.4 getAllCinemas

**Summary:** Retrieves all cinemas filtered by status, ordered by name ascending.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `status` | `CinemaStatusEnum` | ✅ | `ACTIVE` \| `MAINTENANCE` \| `CLOSED` |

**Output (Success):**
```typescript
{
  data: CinemaDetailResponse[],
  message: 'Get all cinemas successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.cinemas.findMany()` |

#### Side Effects & State Changes

- 📖 **Read-only** operation - No state changes

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get all ACTIVE cinemas | ✅ Success | Returns array of active cinemas |
| Get cinemas when database is empty | ✅ Success | Returns empty array `[]` |
| Get MAINTENANCE cinemas | ✅ Success | Returns only maintenance cinemas |

---

### 1.5 getMoviesByCinema

**Summary:** Retrieves movies currently playing at a specific cinema with their upcoming showtimes. Only returns showtimes with `SELLING` status.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |
| `query.page` | `number` | ❌ | Default: 1 |
| `query.limit` | `number` | ❌ | Default: 10 |

**Output (Success):**
```typescript
{
  meta: {
    page: number,
    limit: number,
    totalRecords: number,
    totalPages: number,
    hasPrev: boolean,
    hasNext: boolean
  },
  data: MovieWithShowtimeResponse[],
  message: 'Get movies successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.showtimes.findMany()` |
| `MOVIE_SERVICE` | Microservice | **Mock RPC call** to `MovieServiceMessage.MOVIE.GET_LIST_BY_ID` |
| `Showtimes` table | DB Table | Must have `status = SELLING` and `start_time >= now()` |

#### Side Effects & State Changes

- 📖 **Read-only** operation
- ⚡ Makes **RPC call** to `movie-service` to fetch movie details

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get movies for cinema with upcoming showtimes | ✅ Success | Returns paginated movie list with showtimes |
| Get movies for cinema with no showtimes | ✅ Success | Returns empty data with `totalRecords: 0` |
| Movie service timeout (5000ms) | ❌ Failure | `BadRequestException: Cannot fetch movies` |
| Invalid cinema ID format | ❌ Failure | Returns empty array |

**Error Codes/Exceptions:**
- `BadRequestException` - Movie service communication failure

---

### 1.6 getAllMoviesWithShowtimes

**Summary:** Retrieves all movies with showtimes across all cinemas for a specific date, grouped by movie and cinema.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `query.date` | `string` | ❌ | Format: `YYYY-MM-DD`. Default: today |

**Output (Success):**
```typescript
{
  data: MovieWithCinemaAndShowtimeResponse[],
  message: 'Get movies successfully!'
}

interface MovieWithCinemaAndShowtimeResponse {
  id: string;
  title: string;
  // ... movie fields
  cinemas: {
    cinemaId: string;
    name: string;
    address: string;
    showtimes: ShowtimeSummaryResponse[];
  }[];
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.showtimes.findMany()` with cinema include |
| `MOVIE_SERVICE` | Microservice | **Mock RPC call** to get movie details |

#### Side Effects & State Changes

- 📖 **Read-only** operation
- ⚡ Makes **RPC call** to `movie-service`

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get movies for today with showtimes | ✅ Success | Returns movies grouped by cinema |
| No showtimes for selected date | ✅ Success | Returns empty array |
| Movie service unavailable | ❌ Failure | `BadRequestException` |

---

## 2. Cinema Location Module

### 2.1 getCinemasNearby

**Summary:** Returns cinemas within a specified radius from a given latitude/longitude, sorted by distance.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `latitude` | `number` | ✅ | Valid latitude (-90 to 90) |
| `longitude` | `number` | ✅ | Valid longitude (-180 to 180) |
| `radiusKm` | `number` | ❌ | Default: 10 km |
| `limit` | `number` | ❌ | Default: 20 |

**Output (Success):**
```typescript
{
  data: {
    cinemas: CinemaLocationResponse[],
    total: number,
    page: 1,
    limit: number,
    hasMore: false
  },
  message: 'Get nearby cinemas successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.cinemas.findMany()` |
| `DistanceCalculator` | Utility | Uses Haversine formula |
| `CinemaLocationMapper` | Mapper | Transforms DB entities |

#### Side Effects & State Changes

- 📖 **Read-only** operation

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Find cinemas within 10km radius | ✅ Success | Returns sorted list by distance |
| No cinemas within radius | ✅ Success | Returns empty array |
| Missing latitude | ❌ Failure | `BadRequestException` |
| Missing longitude | ❌ Failure | `BadRequestException` |

**Error Codes/Exceptions:**
- `BadRequestException` (400) - Missing latitude/longitude

---

### 2.2 getCinemasWithFilters

**Summary:** Retrieves cinemas with advanced filtering options including location, city, district, amenities, hall types, and rating.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `latitude` | `number` | ❌ | For distance filtering |
| `longitude` | `number` | ❌ | For distance filtering |
| `radiusKm` | `number` | ❌ | Requires lat/long |
| `city` | `string` | ❌ | Case-insensitive search |
| `district` | `string` | ❌ | Case-insensitive search |
| `amenities` | `string[]` | ❌ | Must have ALL specified amenities |
| `hallTypes` | `HallType[]` | ❌ | `STANDARD`, `VIP`, `IMAX`, `FOUR_DX`, `PREMIUM` |
| `minRating` | `number` | ❌ | Decimal(2,1) |
| `page` | `number` | ❌ | Default: 1 |
| `limit` | `number` | ❌ | Default: 20 |
| `sortBy` | `string` | ❌ | `distance` \| `rating` \| `name`. Default: `distance` |
| `sortOrder` | `string` | ❌ | `asc` \| `desc`. Default: `asc` |

**Output (Success):**
```typescript
{
  data: {
    cinemas: CinemaLocationResponse[],
    total: number,
    page: number,
    limit: number,
    hasMore: boolean
  },
  message: 'Get cinemas with filters successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock complex query with includes |
| `Halls` table | DB Table | For hall type filtering |

#### Side Effects & State Changes

- 📖 **Read-only** operation

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Filter by city | ✅ Success | Returns cinemas in that city |
| Filter by amenities (parking, wifi) | ✅ Success | Only cinemas with ALL amenities |
| Filter by IMAX hall type | ✅ Success | Only cinemas with IMAX halls |
| Sort by rating descending | ✅ Success | Highest rated first |
| No matching filters | ✅ Success | Returns empty array |

---

### 2.3 getCinemaDetail

**Summary:** Retrieves detailed information about a specific cinema by ID.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |
| `userLatitude` | `number` | ❌ | For distance calculation |
| `userLongitude` | `number` | ❌ | For distance calculation |

**Output (Success):**
```typescript
{
  data: CinemaLocationResponse,
  message: 'Get cinema detail successfully!'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.cinemas.findUnique()` with halls include |

#### Side Effects & State Changes

- 📖 **Read-only** operation

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get existing cinema detail | ✅ Success | Returns full cinema info with halls |
| Get cinema with user location | ✅ Success | Response includes calculated distance |
| Non-existent cinema ID | ❌ Failure | `NotFoundException` (404) |

**Error Codes/Exceptions:**
- `NotFoundException` (404) - Cinema not found

---

### 2.4 searchCinemas

**Summary:** Searches cinemas by name, address, or city (case-insensitive). Limited to 20 results.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `query` | `string` | ✅ | Search term |
| `userLatitude` | `number` | ❌ | For distance calculation |
| `userLongitude` | `number` | ❌ | For distance calculation |

**Output (Success):**
```typescript
{
  data: CinemaLocationResponse[],
  message: 'Search cinemas successfully!'
}
```

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Search by partial cinema name | ✅ Success | Returns matching cinemas |
| Search by city name | ✅ Success | Returns cinemas in that city |
| Empty search query | ✅ Success | Returns empty/all results |
| No matches found | ✅ Success | Returns empty array |

---

### 2.5 getAvailableCities

**Summary:** Returns a distinct list of cities that have active cinemas.

#### The Contract (Inputs/Outputs)

**Inputs:** None

**Output (Success):**
```typescript
{
  data: string[],  // e.g., ["Ho Chi Minh City", "Hanoi", "Da Nang"]
  message: 'Get available cities successfully!'
}
```

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Multiple active cinemas in different cities | ✅ Success | Returns distinct city names |
| No active cinemas | ✅ Success | Returns empty array |

---

### 2.6 getAvailableDistricts

**Summary:** Returns a distinct list of districts for a given city that have active cinemas.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `city` | `string` | ✅ | Case-insensitive match |

**Output (Success):**
```typescript
{
  data: string[],  // e.g., ["District 1", "District 7", "Binh Thanh"]
  message: 'Get available districts successfully!'
}
```

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Valid city with multiple districts | ✅ Success | Returns distinct districts |
| City with no cinemas | ✅ Success | Returns empty array |
| Cinemas with null district | ✅ Success | Null districts are filtered out |

---

## 3. Showtime Module

### 3.1 getShowtimes

**Summary:** Retrieves showtimes with optional filters (admin endpoint). Joins with movie-service to get movie titles.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ❌ | Valid UUID |
| `date` | `string` | ❌ | Format: `YYYY-MM-DD` |
| `movieId` | `string` | ❌ | Valid UUID |
| `hallId` | `string` | ❌ | Valid UUID |

**Output (Success):**
```typescript
{
  data: ShowtimeSummaryResponse[],
  message: 'Fetch showtimes successfully'
}

interface ShowtimeSummaryResponse {
  id: string;
  cinemaId: string;
  cinemaName: string;
  movieId: string;
  movieTitle: string;
  hallId: string;
  hallName: string;
  format: FormatEnum;  // TWO_D | THREE_D | IMAX | FOUR_DX
  startTime: Date;
  endTime: Date;
  language: string;
  subtitles: string[];
  availableSeats: number;
  totalSeats: number;
  status: ShowtimeStatusEnum;
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock with hall and cinema includes |
| `MOVIE_SERVICE` | Microservice | **Mock RPC call** `MOVIE.GET_LIST_BY_ID` |

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get all showtimes for a cinema | ✅ Success | Returns showtimes with movie titles |
| Filter by date | ✅ Success | Only showtimes on that date |
| No filters | ✅ Success | Returns all showtimes |

---

### 3.2 getShowtimeById

**Summary:** Retrieves a single showtime by ID.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `showtimeId` | `string` | ✅ | Valid UUID |

**Output (Success):**
```typescript
{
  data: ShowtimeDetailResponse,
  message: 'Fetch showtime successfully'
}
```

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get existing showtime | ✅ Success | Returns showtime details |
| Non-existent showtime | ❌ Failure | `NotFoundException` (404) |

---

### 3.3 getMovieShowtimesAtCinema

**Summary:** Returns showtimes for a specific movie at a specific cinema on a given date. Results are **cached for 60 seconds**.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |
| `movieId` | `string` | ✅ | Valid UUID |
| `query.date` | `string` | ✅ | Format: `YYYY-MM-DD` |

**Output (Success):**
```typescript
{
  data: ShowtimeSummaryResponse[],
  message: 'Fetch showtimes successfully'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Mock `prisma.showtimes.findMany()` |
| `RealtimeService` | Redis | **Mock cache** `getOrSetCache()` with key `showtime:list:{cinemaId}:{movieId}:{date}` |

#### Side Effects & State Changes

- 📖 **Read-only** operation
- ⚡ **Caches** result in Redis for 60 seconds

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get showtimes (cache miss) | ✅ Success | Queries DB, caches result |
| Get showtimes (cache hit) | ✅ Success | Returns from Redis cache |
| No showtimes for movie at cinema | ✅ Success | Returns empty array |
| Only returns SELLING status | ✅ Success | Excludes SCHEDULED/CANCELLED |

---

### 3.4 adminGetMovieShowtimes

**Summary:** Admin endpoint to get showtimes with advanced filters including status, format, hall, and language.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |
| `movieId` | `string` | ✅ | Valid UUID |
| `query.date` | `string` | ✅ | Format: `YYYY-MM-DD` |
| `query.status` | `ShowtimeStatus` | ❌ | `SCHEDULED` \| `SELLING` \| `SOLD_OUT` \| `CANCELLED` \| `COMPLETED` |
| `query.format` | `Format` | ❌ | `TWO_D` \| `THREE_D` \| `IMAX` \| `FOUR_DX` |
| `query.hallId` | `string` | ❌ | Valid UUID |
| `query.language` | `string` | ❌ | e.g., "vi", "en" |

---

### 3.5 getShowtimeSeats

**Summary:** Retrieves all seats for a showtime with their current status (available, held, confirmed) and pricing. Contains both **cached** (static) and **real-time** (dynamic) data.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `showtimeId` | `string` | ✅ | Valid UUID |
| `userId` | `string` | ❌ | For identifying user's held seats |

**Output (Success):**
```typescript
interface ShowtimeSeatResponse {
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  layoutType: LayoutType;
  startTime: Date;
  endTime: Date;
  seats: {
    id: string;
    rowLetter: string;
    seatNumber: number;
    type: SeatType;
    status: ReservationStatusEnum;  // AVAILABLE | HELD | CONFIRMED
    price: number;
    isUserHeld: boolean;  // True if held by current user
  }[];
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Multiple queries for showtime, seats, pricing |
| `RealtimeService` | Redis | **Mock caching** for static data |
| `MOVIE_SERVICE` | Microservice | **Mock RPC** for movie title |
| `SeatReservations` table | DB | Confirmed seats |
| Redis keys | Cache | `hold:showtime:{id}:*` for held seats |

**Cached Data (60s TTL):**
- `showtime:detail:{id}` - Showtime + hall info
- `hall:{id}:seats` - Seat layout
- `ticketPricing:{hallId}:{dayType}` - Pricing

**Real-time Data (No cache):**
- `SeatReservations` with status `CONFIRMED`
- Redis held seats via `getAllHeldSeats()`
- User's held seats via `getUserHeldSeats()`

#### Side Effects & State Changes

- 📖 **Read-only** operation
- ⚡ Multiple Redis cache reads/writes

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Get seats with available, held, and confirmed seats | ✅ Success | Correct status for each seat |
| User's own held seats marked as `isUserHeld: true` | ✅ Success | Boolean flag set correctly |
| Showtime not found | ❌ Failure | `NotFoundException` (404) |
| Movie service timeout | ❌ Failure | Returns empty movie title |

---

### 3.6 getSeatsHeldByUser

**Summary:** Returns the list of seats currently held by a specific user for a showtime, including seat prices and TTL.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `showtimeId` | `string` | ✅ | Valid UUID |
| `userId` | `string` | ✅ | User identifier |

**Output (Success):**
```typescript
interface SeatPricingWithTtlDto {
  seats: SeatPricingDto[];
  lockTtl: number;  // Remaining seconds until hold expires
}

interface SeatPricingDto {
  id: string;
  hallId: string;
  rowLetter: string;
  seatNumber: number;
  type: SeatTypeEnum;
  price: number;
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `RealtimeService` | Redis | Mock `getUserHeldSeats()` and `getUserTTL()` |
| `PrismaService` | Database | For seat and pricing lookup |

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| User has 3 held seats | ✅ Success | Returns 3 seats with prices and TTL |
| User has no held seats | ✅ Success | Returns `{ seats: [], lockTtl: -2 }` |
| Showtime not found | ❌ Failure | `NotFoundException` |

---

### 3.7 getSessionTTL

**Summary:** Returns the remaining TTL (time-to-live) for a user's seat hold session.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `showtimeId` | `string` | ✅ | Valid UUID |
| `userId` | `string` | ✅ | User identifier |

**Output (Success):**
```typescript
{ ttl: number }  // Seconds remaining, -2 if no session
```

---

### 3.8 createShowtime

**Summary:** Creates a new showtime for a movie at a cinema hall. Validates cinema/hall status and checks for time conflicts.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `movieId` | `string` | ✅ | Valid UUID |
| `movieReleaseId` | `string` | ✅ | Valid UUID for active release |
| `cinemaId` | `string` | ✅ | Valid UUID, cinema must be ACTIVE |
| `hallId` | `string` | ✅ | Valid UUID, hall must be ACTIVE |
| `startTime` | `string` | ✅ | ISO 8601 datetime |
| `format` | `Format` | ✅ | `TWO_D` \| `THREE_D` \| `IMAX` \| `FOUR_DX` |
| `language` | `string` | ✅ | e.g., "vi", "en" |
| `subtitles` | `string[]` | ❌ | Array of subtitle languages |

**Output (Success):**
```typescript
{
  data: ShowtimeDetailResponse,
  message: 'Showtime created successfully'
}
```

#### Dependencies & Mocks

| **Dependency** | **Type** | **Note for Tester** |
|----------------|----------|---------------------|
| `PrismaService` | Database | Transactions for creation |
| `MOVIE_SERVICE` | Microservice | **Mock RPC** for movie details (to get runtime) |
| `Cinemas` table | DB | Must exist and be ACTIVE |
| `Halls` table | DB | Must exist and be ACTIVE |
| `Seats` table | DB | For calculating `total_seats` |

#### Side Effects & State Changes

- ✅ **Creates** new row in `Showtimes` table
- ✅ `end_time` = `start_time` + movie runtime + 15 min buffer
- ✅ `total_seats` and `available_seats` set from hall seat count
- ✅ `day_type` auto-calculated (WEEKDAY/WEEKEND)

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Create showtime successfully | ✅ Success | Showtime created with calculated end_time |
| Hall has time conflict | ❌ Failure | `SHOWTIME_CONFLICT` (409) |
| Cinema is INACTIVE | ❌ Failure | `CINEMA_INACTIVE` (409) |
| Hall is INACTIVE | ❌ Failure | `HALL_INACTIVE` (409) |
| Movie not found | ❌ Failure | `MOVIE_NOT_FOUND` (404) |
| Movie release not found | ❌ Failure | `MOVIE_RELEASE_NOT_FOUND` (404) |
| Missing movieReleaseId | ❌ Failure | `MOVIE_RELEASE_REQUIRED` (409) |

**Error Codes/Exceptions:**
- `SHOWTIME_CONFLICT` (409) - Another showtime overlaps
- `CINEMA_NOT_FOUND` (404)
- `HALL_NOT_FOUND` (404)
- `CINEMA_INACTIVE` (409)
- `HALL_INACTIVE` (409)
- `MOVIE_NOT_FOUND` (404)
- `MOVIE_RELEASE_NOT_FOUND` (404)
- `MOVIE_RELEASE_REQUIRED` (409)

---

### 3.9 batchCreateShowtimes

**Summary:** Creates multiple showtimes for a movie over a date range with specified time slots. Skips conflicting slots.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `movieId` | `string` | ✅ | Valid UUID |
| `movieReleaseId` | `string` | ✅ | Valid UUID |
| `cinemaId` | `string` | ✅ | Valid UUID |
| `hallId` | `string` | ✅ | Valid UUID |
| `startDate` | `string` | ✅ | `YYYY-MM-DD` |
| `endDate` | `string` | ✅ | `YYYY-MM-DD` |
| `timeSlots` | `string[]` | ✅ | Array of `HH:mm` times |
| `repeatType` | `string` | ✅ | `DAILY` \| `WEEKLY` \| `CUSTOM_WEEKDAYS` |
| `weekdays` | `number[]` | ❌ | For CUSTOM_WEEKDAYS (0=Sun, 6=Sat) |
| `format` | `Format` | ✅ | Format enum |
| `language` | `string` | ✅ | Language code |
| `subtitles` | `string[]` | ❌ | Subtitle languages |

**Output (Success):**
```typescript
{
  data: {
    createdCount: number,
    skippedCount: number,
    created: ShowtimeDetailResponse[],
    skipped: { start: Date, reason: string }[]
  },
  message: 'Batch create showtimes completed'
}
```

#### Side Effects & State Changes

- ✅ **Creates** multiple rows in `Showtimes` table
- ⚠️ Skips conflicting time slots (doesn't fail)

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Create 7 days of showtimes with 3 slots each | ✅ Success | 21 showtimes created |
| Some slots conflict | ✅ Success | Conflicting slots in `skipped` array |
| Date range outside movie release period | ❌ Failure | `MOVIE_RELEASE_PERIOD_VIOLATION` (409) |

---

### 3.10 updateShowtime

**Summary:** Updates an existing showtime. Cannot update time/hall if reservations exist.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `showtimeId` | `string` | ✅ | Valid UUID |
| `updateData.startTime` | `string` | ❌ | Blocked if reservations exist |
| `updateData.hallId` | `string` | ❌ | Blocked if reservations exist |
| `updateData.movieId` | `string` | ❌ | Can change movie |
| `updateData.format` | `Format` | ❌ | Format enum |
| `updateData.language` | `string` | ❌ | Language code |
| `updateData.subtitles` | `string[]` | ❌ | Subtitle languages |

**Output (Success):**
```typescript
{
  data: ShowtimeDetailResponse,
  message: 'Showtime updated successfully'
}
```

#### Side Effects & State Changes

- ✅ **Updates** `Showtimes` row
- ✅ Recalculates `end_time` if `startTime` or `movieId` changes
- ✅ Updates `updated_at` timestamp

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Update format and language | ✅ Success | Fields updated |
| Update startTime with reservations | ❌ Failure | `SHOWTIME_WITH_RESERVATIONS` (409) |
| Update to conflicting time slot | ❌ Failure | `SHOWTIME_CONFLICT` (409) |
| Showtime not found | ❌ Failure | `NotFoundException` (404) |

---

### 3.11 cancelShowtime

**Summary:** Cancels or deletes a showtime. If reservations exist, sets status to CANCELLED. Otherwise, hard deletes.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `showtimeId` | `string` | ✅ | Valid UUID |

**Output (Success):**
```typescript
{
  data: undefined,
  message: 'Showtime cancelled successfully'
}
```

#### Side Effects & State Changes

- If **no reservations**: Hard delete from `Showtimes` table
- If **has reservations**: Sets `status = CANCELLED`, then deletes

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Cancel showtime with no reservations | ✅ Success | Row deleted |
| Cancel showtime with reservations | ✅ Success | Status set to CANCELLED, then deleted |
| Showtime not found | ❌ Failure | `SHOWTIME_NOT_FOUND` (404) |

---

## 4. Hall Module

### 4.1 getHallDetail

**Summary:** Retrieves detailed information about a hall including all seats.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `hallId` | `string` | ✅ | Valid UUID |

**Output (Success):**
```typescript
{
  data: HallDetailResponse,
  message: 'Get hall successfully!'
}

interface HallDetailResponse {
  id: string;
  cinemaId: string;
  name: string;
  type: HallType;
  capacity: number;
  rows: number;
  screenType?: string;
  soundSystem?: string;
  features: string[];
  status: HallStatus;
  layoutType: LayoutType;
  seats: SeatResponse[];
}
```

---

### 4.2 getHallsOfCinema

**Summary:** Retrieves all halls for a cinema filtered by status.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID |
| `status` | `HallStatusEnum` | ✅ | `ACTIVE` \| `MAINTENANCE` \| `CLOSED` |

---

### 4.3 createHall

**Summary:** Creates a new hall for a cinema. Auto-generates seats based on layout and auto-creates ticket pricing.

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `cinemaId` | `string` | ✅ | Valid UUID, cinema must be ACTIVE |
| `name` | `string` | ✅ | Max 100 chars |
| `type` | `HallType` | ✅ | `STANDARD` \| `VIP` \| `IMAX` \| `FOUR_DX` \| `PREMIUM` |
| `capacity` | `number` | ✅ | Total seat count |
| `rows` | `number` | ✅ | Number of seat rows |
| `screenType` | `string` | ❌ | Max 50 chars |
| `soundSystem` | `string` | ❌ | Max 50 chars |
| `features` | `string[]` | ❌ | Array of features |
| `layoutType` | `LayoutType` | ❌ | `STANDARD` \| `DUAL_AISLE` \| `STADIUM` |

**Output (Success):**
```typescript
{
  data: HallDetailResponse,
  message: 'Create hall successfully!'
}
```

#### Side Effects & State Changes

- ✅ **Creates** row in `Halls` table
- ✅ **Creates** multiple rows in `Seats` table (auto-generated)
- ✅ **Creates** `TicketPricing` entries for each seat type × day type combination

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Create hall with STANDARD layout | ✅ Success | Hall + seats + pricing created |
| Create hall for INACTIVE cinema | ❌ Failure | `CINEMA_INACTIVE` (409) |
| Cinema not found | ❌ Failure | `ResourceNotFoundException` (404) |

---

### 4.4 updateHall

**Summary:** Updates hall properties.

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Update hall name | ✅ Success | Name updated |
| Update non-existent hall | ❌ Failure | `ResourceNotFoundException` |

---

### 4.5 deleteHall

**Summary:** Deletes a hall. Fails if hall has showtimes or other references.

#### Side Effects & State Changes

- ✅ **Deletes** row from `Halls` table
- ⚠️ **Cascade**: Deletes related `Seats` and `TicketPricing`

#### Test Scenarios

| **Scenario** | **Type** | **Expected Result** |
|--------------|----------|---------------------|
| Delete hall with no showtimes | ✅ Success | Hall deleted |
| Delete hall with showtimes | ❌ Failure | `HALL_IN_USE` (400) |
| Hall not found | ❌ Failure | `HALL_NOT_FOUND` (404) |

**Error Codes:**
- `HALL_NOT_FOUND` (404) - P2025
- `HALL_IN_USE` (400) - P2003

---

### 4.6 updateSeatStatus

**Summary:** Updates the status of a specific seat (e.g., mark as broken).

#### The Contract (Inputs/Outputs)

| **Inputs** | **Type** | **Required** | **Constraints** |
|------------|----------|--------------|-----------------|
| `seatId` | `string` | ✅ | Valid UUID |
| `updateSeatStatusRequest.status` | `SeatStatus` | ✅ | `ACTIVE` \| `BROKEN` \| `MAINTENANCE` |

---

## 5. Realtime Module (Seat Hold Management)

> **Note:** This module operates via Redis Pub/Sub channels, not direct HTTP/RPC calls.

### Overview

The realtime module manages temporary seat holds using Redis with the following configuration:
- **Hold Limit:** 8 seats per user per showtime
- **Hold TTL:** 600 seconds (10 minutes)

### Redis Key Patterns

| **Key Pattern** | **Purpose** | **Data Type** |
|-----------------|-------------|---------------|
| `hold:showtime:{showtimeId}:{seatId}` | Tracks who holds a specific seat | String (userId) |
| `hold:user:{userId}:showtime:{showtimeId}` | Tracks all seats held by a user | Set (seatIds) |

### Pub/Sub Channels

#### Subscribed Channels (Input)
| **Channel** | **Payload** | **Action** |
|-------------|-------------|------------|
| `gateway.hold_seat` | `SeatEvent { showtimeId, seatId, userId }` | Hold seat for user |
| `gateway.release_seat` | `SeatEvent { showtimeId, seatId, userId }` | Release held seat |
| `booking.seat_booked` | `SeatBookingEvent` | Finalize booking |
| `booking.confirmed` | `SeatBookingEvent` | Create seat reservations |

#### Published Channels (Output)
| **Channel** | **Published When** |
|-------------|-------------------|
| `cinema.seat_held` | Seat successfully held |
| `cinema.seat_released` | Seat released |
| `cinema.seat_limit_reached` | User tries to hold > 8 seats |
| `cinema.seat_booked` | Booking finalized |

### Test Scenarios for Seat Hold Flow

| **Scenario** | **Type** | **Expected Behavior** |
|--------------|----------|----------------------|
| Hold seat when available | ✅ Success | Redis keys created, publishes `cinema.seat_held` |
| Hold seat already held by another user | ✅ Ignored | No action taken |
| Hold 9th seat (limit reached) | ⚠️ Rejected | Publishes `cinema.seat_limit_reached` |
| Release held seat | ✅ Success | Redis keys deleted, publishes `cinema.seat_released` |
| User switches showtime | ✅ Auto-release | Old seats released, new hold created |
| Booking confirmed | ✅ Success | Redis keys deleted, `SeatReservations` created in DB |

### Dependencies to Mock

| **Dependency** | **Note for Tester** |
|----------------|---------------------|
| `RedisPubSubService` | Mock all methods: `set`, `get`, `del`, `smembers`, `sadd`, `srem`, `subscribe`, `publish`, `keys`, `pipeline`, `ttl`, `scard`, `exists`, `expire` |
| `ResolveBookingService` | Mock `createSeatReservations()` |
| `PrismaService` | For creating `SeatReservations` records |

---

## Appendix: Database Schema Summary

### Tables

| **Table** | **Purpose** |
|-----------|-------------|
| `Cinemas` | Cinema locations |
| `Halls` | Screening rooms within cinemas |
| `Seats` | Individual seats in halls |
| `TicketPricing` | Pricing matrix (hall × seat_type × day_type) |
| `Showtimes` | Movie screening schedules |
| `SeatReservations` | Confirmed seat bookings |
| `CinemaReviews` | User reviews of cinemas |

### Enums

| **Enum** | **Values** |
|----------|-----------|
| `CinemaStatus` | ACTIVE, MAINTENANCE, CLOSED |
| `HallStatus` | ACTIVE, MAINTENANCE, CLOSED |
| `HallType` | STANDARD, VIP, IMAX, FOUR_DX, PREMIUM |
| `LayoutType` | STANDARD, DUAL_AISLE, STADIUM |
| `SeatType` | STANDARD, VIP, COUPLE, PREMIUM, WHEELCHAIR |
| `SeatStatus` | ACTIVE, BROKEN, MAINTENANCE |
| `DayType` | WEEKDAY, WEEKEND, HOLIDAY |
| `Format` | TWO_D, THREE_D, IMAX, FOUR_DX |
| `ShowtimeStatus` | SCHEDULED, SELLING, SOLD_OUT, CANCELLED, COMPLETED |
| `ReservationStatus` | CONFIRMED, CANCELLED |

---

## External Service Dependencies

| **Service** | **Protocol** | **Message Patterns Used** |
|-------------|--------------|---------------------------|
| `movie-service` | TCP/RPC | `MOVIE.GET_DETAIL`, `MOVIE.GET_LIST_BY_ID`, `MOVIE.GET_LIST_RELEASE` |
| `booking-service` | Redis Pub/Sub | `booking.confirmed`, `booking.seat_booked` |

---

*Document generated: 2026-01-02*
*Version: 1.0*
