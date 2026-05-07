# Movie Service - Integration Test Documentation

> **Purpose:** This document serves as the source of truth for writing Integration Tests for the Movie Service microservice.
>
> **Service:** `movie-service` > **Protocol:** TCP Microservice (NestJS `@MessagePattern`)
> **Database:** PostgreSQL (via Prisma ORM)

---

## Table of Contents

1. [Movie Module](#1-movie-module)
   - [getMovies](#11-getmovies)
   - [getDetail](#12-getdetail)
   - [createMovie](#13-createmovie)
   - [updateMovie](#14-updatemovie)
   - [deleteMovie](#15-deletemovie)
   - [getMovieByListId](#16-getmoviebylistid-internal)
2. [Movie Release Module](#2-movie-release-module)
   - [getMovieRelease](#21-getmovierelease)
   - [createMovieRelease](#22-createmovierelease)
   - [updateMovieRelease](#23-updatemovierelease)
   - [deleteMovieRelease](#24-deletemovierelease)
3. [Review Module](#3-review-module)
   - [getReviews](#31-getreviews)
   - [createReview](#32-createreview)
   - [updateReview](#33-updatereview)
   - [deleteReview](#34-deletereview)
4. [Genre Module](#4-genre-module)
   - [getGenres](#41-getgenres)
   - [findGenreById](#42-findgenrebyid)
   - [createGenre](#43-creategenre)
   - [updateGenre](#44-updategenre)
   - [deleteGenre](#45-deletegenre)

---

## 1. Movie Module

### 1.1 getMovies

**Summary:** Retrieves a paginated list of movies, optionally filtered by status (now showing, upcoming).

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.GET_LIST`

| **Inputs**        | **Type** | **Required** | **Constraints**                             |
| ----------------- | -------- | ------------ | ------------------------------------------- |
| `query.page`      | `number` | ❌           | Default: 1                                  |
| `query.limit`     | `number` | ❌           | Default: 10                                 |
| `query.status`    | `string` | ❌           | `now_show` \| `upcoming`                    |
| `query.sortBy`    | `string` | ❌           | Field name to sort by (e.g., `releaseDate`) |
| `query.sortOrder` | `string` | ❌           | `asc` \| `desc`                             |

**Output (Success):**

```typescript
{
  data: MovieSummary[],
  meta: {
    page: number,
    limit: number,
    totalRecords: number,
    totalPages: number,
    hasPrev: boolean,
    hasNext: boolean
  }
}

interface MovieSummary {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  runtime: number;
  ageRating: AgeRatingEnum; // P, K, T13, T16, T18, C
  productionCountry: string;
  languageType: LanguageOptionEnum; // ORIGINAL, SUBTITLE, DUBBED
  averageRating: number;
  reviewCount: number;
}
```

#### Dependencies & Mocks

| **Dependency**       | **Type** | **Note for Tester**            |
| -------------------- | -------- | ------------------------------ |
| `PrismaService`      | Database | Mock `prisma.movie.findMany()` |
| `MovieRelease` table | DB       | Used for status filtering      |

#### Test Scenarios

| **Scenario**             | **Type**   | **Expected Result**                                                 |
| ------------------------ | ---------- | ------------------------------------------------------------------- |
| Get "now showing" movies | ✅ Success | Returns movies with active releases (startDate <= today <= endDate) |
| Get "upcoming" movies    | ✅ Success | Returns movies with future releases (startDate > today)             |
| Pagination check         | ✅ Success | Returns correct subset and meta info                                |
| No movies found          | ✅ Success | Returns empty data array                                            |

---

### 1.2 getDetail

**Summary:** Retrieves full details of a specific movie, including genres and aggregate rating statistics.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.GET_DETAIL`

| **Inputs** | **Type** | **Required** | **Constraints** |
| ---------- | -------- | ------------ | --------------- |
| `id`       | `string` | ✅           | Valid UUID      |

**Output (Success):**

```typescript
{
  data: MovieDetailResponse;
}

interface MovieDetailResponse {
  id: string;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string;
  trailerUrl: string;
  backdropUrl: string;
  runtime: number;
  releaseDate: Date;
  ageRating: AgeRatingEnum;
  originalLanguage: string;
  spokenLanguages: string[];
  languageType: LanguageOptionEnum;
  productionCountry: string;
  director: string;
  cast: object; // JSON
  genre: { id: string; name: string }[];
  averageRating: number;
  reviewCount: number;
}
```

#### Test Scenarios

| **Scenario**              | **Type**   | **Expected Result**                                                                    |
| ------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| Get existing movie        | ✅ Success | Returns full details with computed rating                                              |
| Get movie with no reviews | ✅ Success | `averageRating` is 0, `reviewCount` is 0                                               |
| Non-existent movie        | ❌ Failure | Returns `null` or error (depends on Prisma behavior for `findUnique` rejectOnNotFound) |

---

### 1.3 createMovie

**Summary:** Creates a new movie record and links genres.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.CREATED`

| **Inputs**          | **Type**             | **Required** | **Constraints**      |
| ------------------- | -------------------- | ------------ | -------------------- |
| `title`             | `string`             | ✅           | -                    |
| `originalTitle`     | `string`             | ✅           | -                    |
| `overview`          | `string`             | ✅           | -                    |
| `posterUrl`         | `string`             | ✅           | -                    |
| `trailerUrl`        | `string`             | ✅           | -                    |
| `backdropUrl`       | `string`             | ✅           | -                    |
| `runtime`           | `number`             | ✅           | Minutes              |
| `releaseDate`       | `string`             | ✅           | ISO Date             |
| `ageRating`         | `AgeRatingEnum`      | ✅           | -                    |
| `originalLanguage`  | `string`             | ✅           | -                    |
| `spokenLanguages`   | `string[]`           | ✅           | -                    |
| `languageType`      | `LanguageOptionEnum` | ✅           | -                    |
| `productionCountry` | `string`             | ✅           | -                    |
| `director`          | `string`             | ✅           | -                    |
| `cast`              | `object`             | ✅           | JSON structure       |
| `genreIds`          | `string[]`           | ❌           | Array of Genre UUIDs |

**Output (Success):**

```typescript
{
  data: MovieDetailResponse,
  message: 'Create movie successfully!'
}
```

#### Test Scenarios

| **Scenario**                        | **Type**   | **Expected Result**          |
| ----------------------------------- | ---------- | ---------------------------- |
| Create valid movie                  | ✅ Success | Movie created, genres linked |
| Create with invalid genre IDs       | ❌ Failure | Foreign key constraint error |
| Create with missing required fields | ❌ Failure | Payload validation error     |

---

### 1.4 updateMovie

**Summary:** Updates an existing movie. Replaces genres if `genreIds` is provided.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.UPDATED`

| **Inputs**           | **Type**             | **Required** | **Constraints**           |
| -------------------- | -------------------- | ------------ | ------------------------- |
| `id`                 | `string`             | ✅           | Valid UUID                |
| `updateMovieRequest` | `UpdateMovieRequest` | ✅           | Partial of create request |

**Output (Success):**

```typescript
{
  data: MovieDetailResponse,
  message: 'Update movie successfully!'
}
```

#### Side Effects & State Changes

- ✅ Updates `Movies` table
- ✅ **Replaces** all existing genre links with new `genreIds` if provided (DeleteMany + Create)

#### Test Scenarios

| **Scenario**              | **Type**   | **Expected Result**                |
| ------------------------- | ---------- | ---------------------------------- |
| Update title and runtime  | ✅ Success | Fields updated                     |
| Update genres             | ✅ Success | Old genres removed, new ones added |
| Update non-existent movie | ❌ Failure | `ResourceNotFoundException`        |

---

### 1.5 deleteMovie

**Summary:** Deletes a movie record.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.DELETED`

| **Inputs** | **Type** | **Required** | **Constraints** |
| ---------- | -------- | ------------ | --------------- |
| `id`       | `string` | ✅           | Valid UUID      |

**Output:**

```typescript
{
  message: 'Delete movie successfully!';
}
```

---

### 1.6 getMovieByListId (Internal)

**Summary:** Internal RPC endpoint to fetch details (including reviews/genres) for a list of movie IDs. Used by `cinema-service`.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.GET_LIST_BY_ID`

| **Inputs** | **Type**   | **Required** | **Constraints** |
| ---------- | ---------- | ------------ | --------------- |
| `movieIds` | `string[]` | ✅           | Array of UUIDs  |

**Output:** `MovieDetailResponse[]`

#### Test Scenarios

| **Scenario**      | **Type**   | **Expected Result**       |
| ----------------- | ---------- | ------------------------- |
| Valid list of IDs | ✅ Success | Returns array of details  |
| Partial valid IDs | ✅ Success | Returns only found movies |
| Empty list        | ✅ Success | Returns empty array       |

---

## 2. Movie Release Module

### 2.1 getMovieRelease

**Summary:** Gets all release schedules (start/end dates) for a movie.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.GET_LIST_RELEASE`

| **Inputs** | **Type** | **Required** | **Constraints** |
| ---------- | -------- | ------------ | --------------- |
| `movieId`  | `string` | ✅           | Valid UUID      |

**Output:**

```typescript
{
  data: {
    id: string;
    movieId: string;
    startDate: Date;
    endDate?: Date;
    note?: string;
  }[]
}
```

---

### 2.2 createMovieRelease

**Summary:** Adds a release schedule for a movie.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE_RELEASE.CREATED`

| **Inputs**  | **Type** | **Required** | **Constraints** |
| ----------- | -------- | ------------ | --------------- |
| `movieId`   | `string` | ✅           | Valid UUID      |
| `startDate` | `Date`   | ✅           | -               |
| `endDate`   | `Date`   | ❌           | -               |
| `note`      | `string` | ❌           | -               |

**Output:**

```typescript
{
  data: MovieReleaseResponse,
  message: 'Create movie release successfully!'
}
```

---

### 2.3 updateMovieRelease

**Summary:** Updates a release schedule.

**Message Pattern:** `MOVIE_RELEASE.UPDATED`

---

### 2.4 deleteMovieRelease

**Summary:** Deletes a release schedule.

**Message Pattern:** `MOVIE_RELEASE.DELETED`

---

## 3. Review Module

> **Note:** Review functionality is split. **Creation/Update** is handled by `MovieController` (via `MovieService`), while **Listing/Deletion** is handled by `ReviewController` (via `ReviewService`).

### 3.1 getReviews

**Summary:** Lists reviews with filtering and pagination.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `REVIEW.GET_LIST` (via `ReviewController`) or `MOVIE.GET_REVIEWS` (via `MovieController`) -> _Both map to logic in services._
_Code Check:_ `MovieController` (`MOVIE.GET_REVIEWS`) calls `MovieService.getReviewsByMovie`. `ReviewController` (`REVIEW.GET_LIST`) calls `ReviewService.findAll`. Check implementation consistency.
_Warning:_ Both implementations exist but `MovieService` one is likely the primary for frontend movie details.

| **Inputs**         | **Type** | **Required** | **Constraints**        |
| ------------------ | -------- | ------------ | ---------------------- |
| `query.movieId`    | `string` | ❌           | Filter by movie        |
| `query.userId`     | `string` | ❌           | Filter by user         |
| `query.rating`     | `number` | ❌           | Filter by exact rating |
| `query.page/limit` | `number` | ❌           | Pagination             |

**Output:**

```typescript
{
  data: ReviewResponse[],
  meta: ...
}
```

---

### 3.2 createReview

**Summary:** Creates a review for a movie.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `MOVIE.CREATED_REVIEW` (Handled by `MovieController`)

| **Inputs** | **Type** | **Required** | **Constraints** |
| ---------- | -------- | ------------ | --------------- |
| `movieId`  | `string` | ✅           | Valid UUID      |
| `userId`   | `string` | ✅           | User ID         |
| `rating`   | `number` | ✅           | 1-5 (Int)       |
| `content`  | `string` | ✅           | Review text     |

**Output:**

```typescript
{
  data: ReviewResponse,
  message: 'Create review ... successfully!'
}
```

#### Test Scenarios

| **Scenario**                       | **Type**   | **Expected Result**                   |
| ---------------------------------- | ---------- | ------------------------------------- |
| Create review                      | ✅ Success | Review Created                        |
| Duplicate review (same user/movie) | ❌ Failure | Unique constraint violation (`P2002`) |

---

### 3.3 updateReview

**Summary:** Updates a review content/rating.

**Message Pattern:** `MOVIE.UPDATED_REVIEW` (Handled by `MovieController`)

---

### 3.4 deleteReview

**Summary:** Deletes a review.

**Message Pattern:** `REVIEW.DELETED` (Handled by `ReviewController`)

| **Inputs** | **Type** | **Required** | **Constraints** |
| ---------- | -------- | ------------ | --------------- |
| `id`       | `string` | ✅           | Review UUID     |

---

## 4. Genre Module

### 4.1 getGenres

**Summary:** Returns all genres.

**Message Pattern:** `GENRE.GET_LIST`

**Output:** `{ data: { id, name }[] }`

---

### 4.2 findGenreById

**Summary:** Returns a single genre.

**Message Pattern:** `GENRE.GET_DETAIL`

---

### 4.3 createGenre

**Summary:** Creates a new genre.

**Message Pattern:** `GENRE.CREATED`

| **Inputs** | **Type** | **Required** | **Constraints** |
| ---------- | -------- | ------------ | --------------- |
| `name`     | `string` | ✅           | Unique name     |

---

### 4.4 updateGenre

**Summary:** Updates a genre name.

**Message Pattern:** `GENRE.UPDATED`

---

### 4.5 deleteGenre

**Summary:** Deletes a genre.

**Message Pattern:** `GENRE.DELETED`
