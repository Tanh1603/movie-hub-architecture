# Synthetic Seed Data for Movie Hub Microservices

This directory contains seed scripts and data for populating the Movie Hub microservices with realistic test data.

## 📋 Overview

The seed data is organized by microservice:

| Directory       | Service         | Description                                                                    |
| --------------- | --------------- | ------------------------------------------------------------------------------ |
| `seed_movie/`   | movie-service   | Movies, Genres, MovieReleases, MovieGenres                                     |
| `seed_cinema/`  | cinema-service  | Cinemas, Halls, Seats, TicketPricing, Showtimes, CinemaReviews                 |
| `seed_booking/` | booking-service | Concessions, Promotions, LoyaltyAccounts, Bookings, Tickets, Payments, Refunds |

## ⚠️ Important: Execution Order

The seeds have **dependencies** and must be run in the correct order:

```
1. seed_movie   (creates Movies and MovieReleases)
        ↓
2. seed_cinema  (requires MovieReleases for Showtimes)
        ↓
3. seed_booking (requires Showtimes and Seats for Bookings)
```

## 🚀 How to Run

### Prerequisites

1. Ensure all microservices have their Prisma clients generated:

   ```bash
   cd apps/movie-service && npx prisma generate
   cd apps/cinema-service && npx prisma generate
   cd apps/booking-service && npx prisma generate
   ```

2. Ensure databases are migrated:
   ```bash
   cd apps/movie-service && npx prisma migrate deploy
   cd apps/cinema-service && npx prisma migrate deploy
   cd apps/booking-service && npx prisma migrate deploy
   ```

### Running Seeds

From the `synthetic_seed_data` directory:

```bash
# Step 1: Seed movies (FIRST)
cd seed_movie
node seed.js

# Step 2: Seed cinemas (SECOND)
cd ../seed_cinema
node seed.js

# Step 3: Seed bookings (LAST)
cd ../seed_booking
node seed.js
```

### Alternative: Using npm scripts (if configured)

```bash
npm run seed:movie
npm run seed:cinema
npm run seed:booking
```

## 📊 Generated Data Summary

### Movie Service

- ~50 Movies with Vietnamese titles
- 18 Genres (Vietnamese names)
- 1 MovieRelease per movie (for showtime linking)
- Multiple MovieGenre relationships

### Cinema Service

- 2 Cinemas in Ho Chi Minh City (CGV, Lotte)
- 6 Halls (STANDARD, VIP, IMAX, PREMIUM, FOUR_DX)
- ~700 Seats across all halls
- ~54 Pricing rules (hall × seat_type × day_type)
- ~200+ Showtimes for next 7 days
- Sample CinemaReviews

### Booking Service

- 5 Concession items (popcorn, drinks, combos, merchandise)
- 3 Promotion codes (WELCOME20, STUDENT15, FREECOKE)
- 4 Loyalty accounts (user_1 through user_4)
- 600 Bookings with realistic distribution:
  - ~70% Completed
  - ~20% Pending
  - ~10% Cancelled
- Tickets, Payments, Refunds, BookingConcessions, LoyaltyTransactions

## 🔧 Schema Alignment (v2.0)

These seed scripts have been updated to strictly align with the Prisma schemas:

### Key Fixes Applied

1. **TicketPricing** (cinema-service)

   - ✅ Uses only schema fields: `hall_id`, `seat_type`, `day_type`, `price`
   - ❌ Removed: `ticket_type`, `time_slot` (not in schema)

2. **Showtimes** (cinema-service)

   - ✅ Now includes required `movie_release_id` field
   - ❌ Removed: `time_slot` (not in schema)
   - ✅ Proper relation to MovieRelease from movie-service

3. **Price Lookup** (booking-service)

   - ✅ Query uses only `[hall_id, seat_type, day_type]`
   - ❌ Removed: `ticket_type`, `time_slot` from query

4. **Idempotency Improvements**

   - Uses `upsert` where applicable (promotions, loyalty accounts)
   - Uses `skipDuplicates` in createMany
   - Unique code generation for booking_code and ticket_code

5. **TicketPricing** (cinema-service)

   - ✅ Uses only schema fields: `hall_id`, `seat_type`, `day_type`, `price`
   - ❌ Removed: `ticket_type`, `time_slot` (not in schema)

6. **Showtimes** (cinema-service)

   - ✅ Now includes required `movie_release_id` field
   - ❌ Removed: `time_slot` (not in schema)
   - ✅ Proper relation to MovieRelease from movie-service

7. **Price Lookup** (booking-service)

   - ✅ Query uses only `[hall_id, seat_type, day_type]`
   - ❌ Removed: `ticket_type`, `time_slot` from query

8. **Idempotency Improvements**

   - Uses `upsert` where applicable (promotions, loyalty accounts)
   - Uses `skipDuplicates` in createMany
   - Unique code generation for booking_code and ticket_code

9. **Error Handling**
   - Per-record try-catch for graceful failure handling
   - Detailed error messages with context

## ⚙️ Configuration

### Cross-Service Database Access (v2.1 Update)

To support isolated microservice databases, the seeds now use **Multi-Client** support:

- **seed_cinema** connects to both Cinema (Writer) and Movie (Reader) databases.
- **seed_booking** connects to both Booking (Writer) and Cinema (Reader) databases.

**Configuration:**
If your databases are not running on the default local ports (5436 for Movie, 5437 for Cinema), you can override the connection URLs using environment variables:

```bash
# Example override
export MOVIE_DATABASE_URL=postgresql://user:pass@localhost:5436/movie_hub_movie
export CINEMA_DATABASE_URL=postgresql://user:pass@localhost:5437/movie_hub_cinema
node seed.js
```

### Option B: Isolated Databases (NOW SUPPORTED)

The seeds now explicitly support Option B by using the respective service's generated Prisma clients. This ensures:

- No schema changes are required.
- Relational integrity is maintained across microservice boundaries.
- Works both in monolith (shared DB) and microservice (isolated DB) environments.

### Environment Variables

Each seed script reads Prisma configuration from the respective service's generated client:

```
seed_movie/   → uses apps/movie-service/generated/prisma
seed_cinema/  → uses apps/cinema-service/generated/prisma
seed_booking/ → uses apps/booking-service/generated/prisma
```

## 🐛 Troubleshooting

### "No movies found"

- Run `seed_movie` before `seed_cinema`
- Ensure database connection is correct

### "No showtimes found"

- Run `seed_cinema` before `seed_booking`
- Verify cinema-service has access to movie tables

### "Foreign key constraint failed"

- Check execution order (movie → cinema → booking)
- Ensure referenced records exist

### "Unique constraint violation"

- Re-run the seed (uses deleteMany to clean first)
- Check for duplicate codes in data.json

## 📝 Data Files

### `data.json` Structure

Each seed directory contains a `data.json` with the static seed data:

```javascript
// seed_movie/data.json
{
  "movies": [...],
  "genres": [...]
}

// seed_cinema/data.json
{
  "cinemas": [...],
  "halls": [...],
  "reviews": [...]
}

// seed_booking/data.json
{
  "concessions": [...],
  "promotions": [...],
  "loyaltyAccounts": [...],
  "userIds": [...],
  "customerNames": [...]
}
```

## 🔄 Updating Seed Data

1. Modify the `data.json` file in the relevant directory
2. Re-run the seed script
3. The script will clean existing data and re-seed

## 📦 Version History

- **v2.0 (2026-01-02)**: Schema alignment fixes, added `movie_release_id`, removed non-existent fields, improved idempotency
- **v1.0**: Initial seed data with schema mismatches
