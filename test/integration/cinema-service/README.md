# Cinema Service Integration Tests

This directory contains integration tests for the `cinema-service` microservice.

## Test Architecture

### Key Principles

1. **Database**: Uses **REAL PostgreSQL** - tests run against the actual database, not mocks
2. **External Services**: **MOCKED** - RPC calls to `movie-service` and Redis Pub/Sub are mocked
3. **Protocol Adaptation**: Since this is a TCP microservice (`@MessagePattern`), we **inject controllers directly** and call methods instead of using HTTP/supertest

### Test Structure

```
test/integration/cinema-service/
├── helpers/
│   └── cinema-test-helpers.ts    # Test utilities, mocks, factories
├── 1.cinema-module.spec.ts       # Cinema CRUD operations
├── 2.cinema-location-module.spec.ts  # Location & geo queries
├── 3.showtime-module.spec.ts     # Showtime management
├── 4.hall-module.spec.ts         # Hall & seat management
└── README.md                     # This file
```

## Running the Tests

### Prerequisites

1. Docker must be running with the PostgreSQL database
2. The `cinema-service` database must be migrated

```bash
# Start the database
docker-compose up -d postgres

# Run migrations (if needed)
npx nx run cinema-service:prisma-migrate
```

### Run All Cinema Service Tests

```bash
# Run all integration tests for cinema-service
npx jest --config=apps/cinema-service/jest.config.ts test/integration/cinema-service
```

### Run Specific Test Files

```bash
# Run only Cinema Module tests
npx jest test/integration/cinema-service/1.cinema-module.spec.ts

# Run only Hall Module tests
npx jest test/integration/cinema-service/4.hall-module.spec.ts
```

### Run with Verbose Output

```bash
npx jest --config=apps/cinema-service/jest.config.ts test/integration/cinema-service --verbose
```

## Test Coverage Reference

### 1. Cinema Module (`1.cinema-module.spec.ts`)

| Operation                   | Test Scenarios                                                           |
| --------------------------- | ------------------------------------------------------------------------ |
| `createCinema`              | ✅ Required fields, ✅ Optional fields, ✅ Default status, ✅ Timestamps |
| `updateCinema`              | ✅ Update name, ✅ Update status, ✅ Multiple fields, ❌ Not found       |
| `deleteCinema`              | ✅ Delete success, ❌ Not found, ❌ In use (has halls)                   |
| `getAllCinemas`             | ✅ Filter by status, ✅ Sorted by name, ✅ Empty result                  |
| `getMoviesByCinema`         | ✅ With showtimes, ✅ Empty, ✅ Pagination                               |
| `getAllMoviesWithShowtimes` | ✅ By date, ✅ Empty result                                              |

### 2. Cinema Location Module (`2.cinema-location-module.spec.ts`)

| Operation               | Test Scenarios                                                         |
| ----------------------- | ---------------------------------------------------------------------- |
| `getCinemasNearby`      | ✅ Within radius, ✅ Sorted by distance, ✅ Empty, ❌ Missing lat/long |
| `getCinemasWithFilters` | ✅ City, ✅ Amenities, ✅ Hall types, ✅ Sort by rating                |
| `getCinemaDetail`       | ✅ With halls, ✅ With distance, ❌ Not found                          |
| `searchCinemas`         | ✅ By name, ✅ By city, ✅ Case-insensitive                            |
| `getAvailableCities`    | ✅ Distinct cities, ✅ Ordered, ✅ Empty                               |
| `getAvailableDistricts` | ✅ By city, ✅ Null filtered, ✅ Case-insensitive                      |

### 3. Showtime Module (`3.showtime-module.spec.ts`)

| Operation                   | Test Scenarios                                    |
| --------------------------- | ------------------------------------------------- |
| `getShowtimes`              | ✅ By cinema, ✅ By date, ✅ By movie, ✅ Ordered |
| `getShowtimeById`           | ✅ Success, ❌ Not found                          |
| `getMovieShowtimesAtCinema` | ✅ SELLING only, ✅ Cached                        |
| `getSeatsHeldByUser`        | ✅ With seats, ✅ Empty                           |
| `getSessionTTL`             | ✅ With TTL, ✅ No session                        |
| `createShowtime`            | ✅ Success, ❌ Cinema inactive, ❌ Hall inactive  |
| `cancelShowtime`            | ✅ Success, ✅ With reservations, ❌ Not found    |

### 4. Hall Module (`4.hall-module.spec.ts`)

| Operation          | Test Scenarios                                                       |
| ------------------ | -------------------------------------------------------------------- |
| `getHallDetail`    | ✅ With seats, ✅ Sorted seats, ❌ Not found                         |
| `getHallsOfCinema` | ✅ By status, ✅ Empty                                               |
| `createHall`       | ✅ Auto-generates seats, ✅ Auto-creates pricing, ❌ Cinema inactive |
| `updateHall`       | ✅ Update fields, ❌ Not found                                       |
| `deleteHall`       | ✅ Cascade delete, ❌ Not found, ❌ In use                           |
| `updateSeatStatus` | ✅ BROKEN, ✅ MAINTENANCE, ❌ Not found                              |

## Mocked Dependencies

### MOVIE_SERVICE (RPC Client)

```typescript
const mockMovieClient = {
  send: jest.fn().mockImplementation(() => of([...])),
  emit: jest.fn().mockImplementation(() => of(undefined)),
};
```

Usage in tests:

```typescript
ctx.mockMovieClient.send.mockImplementation(() => of([{ id: 'movie-1', title: 'Test Movie' }]));
```

### RealtimeService (Redis)

```typescript
const mockRealtimeService = {
  getAllHeldSeats: jest.fn().mockResolvedValue({}),
  getUserHeldSeats: jest.fn().mockResolvedValue([]),
  getUserTTL: jest.fn().mockResolvedValue(-2),
  getOrSetCache: jest.fn().mockImplementation((_key, _ttl, fetchFn) => fetchFn()),
  // ... other methods
};
```

## Database Cleanup

Each test file follows this pattern:

```typescript
beforeAll(async () => {
  ctx = await createCinemaTestingModule();
}, 60000);

afterAll(async () => {
  await cleanupCinemaTestData(ctx.prisma);
  await closeCinemaTestContext(ctx);
}, 30000);

beforeEach(async () => {
  await cleanupCinemaTestData(ctx.prisma);
});
```

The `cleanupCinemaTestData()` function deletes records in dependency order:

1. SeatReservations
2. Showtimes
3. TicketPricing
4. Seats
5. Halls
6. CinemaReviews
7. Cinemas

## Troubleshooting

### Jest Hangs After Tests

Ensure `closeCinemaTestContext()` is called in `afterAll`:

```typescript
await ctx.prisma.$disconnect();
await ctx.app.close();
```

### Database Connection Issues

Check environment variables:

- `DATABASE_URL_CINEMA` should point to the cinema database

### Module Import Errors

The test helpers import directly from the app source:

```typescript
import { PrismaService } from '../../../../apps/cinema-service/src/app/prisma.service';
```

If paths break, update the relative imports in `cinema-test-helpers.ts`.

## Reference Documentation

For detailed business logic and test scenarios, see:

- [CINEMA_SERVICE_INTEGRATION_TEST_DOCS.md](../../docs/CINEMA_SERVICE_INTEGRATION_TEST_DOCS.md)
