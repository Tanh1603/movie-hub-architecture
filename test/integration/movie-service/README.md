# Movie Service Integration Tests

This directory contains integration tests for the `movie-service` microservice.

## Test Architecture

### Key Principles

1. **Database**: Uses **REAL PostgreSQL** - tests run against the actual database
2. **External Services**: **NONE** - movie-service has no RPC dependencies
3. **Protocol Adaptation**: Since this is a TCP microservice (`@MessagePattern`), we **inject controllers directly**

### Test Structure

```
test/integration/movie-service/
├── helpers/
│   └── movie-test-helpers.ts    # Test utilities, factories, cleanup
├── 1.movie-module.spec.ts       # Movie + Release CRUD operations
├── 3.review-module.spec.ts      # Review operations with unique constraint tests
├── 4.genre-module.spec.ts       # Genre CRUD operations
└── README.md                    # This file
```

## Running the Tests

### Prerequisites

1. Docker must be running with the PostgreSQL database
2. The `movie-service` database must be migrated

```bash
# Start the database
docker-compose up -d postgres

# Run migrations (if needed)
npx nx run movie-service:prisma-migrate
```

### Run All Movie Service Tests

```bash
# Run all integration tests for movie-service
npx jest --config=apps/movie-service/jest.config.ts test/integration/movie-service
```

### Run Specific Test Files

```bash
# Run only Movie Module tests
npx jest test/integration/movie-service/1.movie-module.spec.ts

# Run only Review Module tests (includes unique constraint tests)
npx jest test/integration/movie-service/3.review-module.spec.ts

# Run only Genre Module tests
npx jest test/integration/movie-service/4.genre-module.spec.ts
```

### Run with Verbose Output

```bash
npx jest --config=apps/movie-service/jest.config.ts test/integration/movie-service --verbose
```

## Test Coverage Reference

### 1. Movie Module (`1.movie-module.spec.ts`)

| Operation          | Test Scenarios                                                                        |
| ------------------ | ------------------------------------------------------------------------------------- |
| `getMovies`        | ✅ All movies, ✅ now_show filter, ✅ upcoming filter, ✅ Pagination, ✅ Rating stats |
| `getDetail`        | ✅ Full details, ✅ With reviews, ✅ No reviews, ❌ Not found                         |
| `createMovie`      | ✅ Basic create, ✅ With genres, ✅ Without genres, ❌ Invalid genreIds (atomicity)   |
| `updateMovie`      | ✅ Update fields, ✅ Replace genres, ❌ Not found                                     |
| `deleteMovie`      | ✅ Delete with cascade, ❌ Not found                                                  |
| `getMovieByListId` | ✅ Valid IDs, ✅ Partial valid, ✅ Empty input                                        |

### 2. Movie Release Module (in `1.movie-module.spec.ts`)

| Operation            | Test Scenarios                      |
| -------------------- | ----------------------------------- |
| `getMovieRelease`    | ✅ All releases, ✅ Empty           |
| `createMovieRelease` | ✅ With endDate, ✅ Without endDate |
| `updateMovieRelease` | ✅ Update dates                     |
| `deleteMovieRelease` | ✅ Delete success                   |

### 3. Review Module (`3.review-module.spec.ts`)

| Operation             | Test Scenarios                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `getReviews (Movie)`  | ✅ Paginated, ✅ Filter by userId, ✅ Filter by rating                                     |
| `getReviews (Review)` | ✅ With movie info, ✅ Consistency check                                                   |
| `createReview`        | ✅ Create success, ❌ **Duplicate (P2002)**, ✅ Different movies OK, ✅ Different users OK |
| `updateReview`        | ✅ Update rating, ✅ Update content, ❌ Not found                                          |
| `deleteReview`        | ✅ Delete success, ✅ Re-create after delete                                               |

### 4. Genre Module (`4.genre-module.spec.ts`)

| Operation       | Test Scenarios                                            |
| --------------- | --------------------------------------------------------- |
| `getGenres`     | ✅ All genres, ✅ Empty                                   |
| `findGenreById` | ✅ Found, ✅ Not found (null)                             |
| `createGenre`   | ✅ Unique name, ❌ Duplicate name (P2002)                 |
| `updateGenre`   | ✅ Update name, ❌ Not found, ❌ Duplicate name           |
| `deleteGenre`   | ✅ Delete success, ❌ Not found, ✅/❌ With linked movies |

## Key Test Findings

### ⚠️ Unique Constraint: Review [movieId, userId]

The `Review` table has a unique constraint on `[movieId, userId]`. Tests verify:

1. **Cannot create duplicate review** - Same user reviewing same movie twice throws `P2002`
2. **Different movies OK** - Same user can review different movies
3. **Different users OK** - Different users can review same movie

```typescript
// This should fail:
await createReview({ movieId: 'movie-1', userId: 'user-1' }); // First - OK
await createReview({ movieId: 'movie-1', userId: 'user-1' }); // Second - P2002!
```

### ⚠️ Transaction Atomicity: createMovie with Genres

When creating a movie with `genreIds`, the operation uses a transaction:

1. If any genreId is invalid (doesn't exist), the entire transaction rolls back
2. No movie is created if genre linking fails

```typescript
// This should fail and NOT create a movie:
await createMovie({
  title: 'Test',
  genreIds: ['non-existent-genre-id'],
}); // Throws error, no movie created
```

### ⚠️ Duplicate Logic: MovieController vs ReviewController

Both controllers have `getReviews`:

| Controller         | Method                                          | Includes Movie Info |
| ------------------ | ----------------------------------------------- | ------------------- |
| `MovieController`  | `getReviews` → `MovieService.getReviewsByMovie` | ❌                  |
| `ReviewController` | `findAll` → `ReviewService.findAll`             | ✅                  |

Tests verify both behave consistently for record counts and filtering.

## Database Schema Relationships

```
Genre (id, name)
   ↑
MovieGenre (movieId, genreId)  -- Many-to-Many
   ↓
Movie (id, title, ...)
   ↓
MovieRelease (id, movieId, startDate, endDate)
   ↓
Review (id, movieId, userId, rating, content)  -- Unique on [movieId, userId]
```

## Cleanup Strategy

Each test file follows this pattern:

```typescript
beforeAll(async () => {
  ctx = await createMovieTestingModule();
}, 60000);

afterAll(async () => {
  await cleanupMovieTestData(ctx.prisma);
  await closeMovieTestContext(ctx);
}, 30000);

beforeEach(async () => {
  await cleanupMovieTestData(ctx.prisma);
});
```

The `cleanupMovieTestData()` function deletes in FK order:

1. Review
2. MovieRelease
3. MovieGenre
4. Movie
5. Genre

## Troubleshooting

### Jest Hangs After Tests

Ensure `closeMovieTestContext()` is called in `afterAll`:

```typescript
await ctx.prisma.$disconnect();
await ctx.app.close();
```

### Database Connection Issues

Check environment variables:

- `DATABASE_URL` should point to the movie database

### Unique Constraint Errors

If tests fail with `P2002` unexpectedly, ensure `beforeEach` cleanup is running.

## Reference Documentation

For detailed business logic and test scenarios, see:

- [MOVIE_SERVICE_INTEGRATION_TEST_DOCS.md](../../docs/MOVIE_SERVICE_INTEGRATION_TEST_DOCS.md)
