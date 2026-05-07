# Integration Test Suite for Movie Hub API

This directory contains comprehensive integration tests for the Movie Hub booking flow.

## Test Files

### 1. `movie-booking-flow.spec.ts`

- **Purpose**: Complete end-to-end booking flow with TypeScript interfaces
- **Coverage**: Movie selection → Cinema location → Showtime selection → Seat booking
- **Features**:
  - Type-safe testing with proper interfaces
  - Step-by-step user journey validation
  - Error handling and edge cases
  - Performance testing

### 2. `cinema-integration.spec.ts`

- **Purpose**: Cinema service specific integration tests
- **Coverage**: Cinema search, location services, showtime integration
- **Features**:
  - Location-based cinema search
  - Geolocation integration testing
  - Showtime availability checks
  - Error handling for invalid inputs

### 3. `user-journey.spec.ts`

- **Purpose**: Complete user story simulation with detailed logging
- **Coverage**: Realistic user booking scenario from start to finish
- **Features**:
  - Detailed console logging of user actions
  - Business rule validation
  - Booking summary generation
  - Adjacent seat selection logic

## Running the Tests

### Prerequisites

Ensure all services are running:
\`\`\`bash
docker compose up -d
\`\`\`

### Run All Integration Tests

\`\`\`bash
npm run test:integration
\`\`\`

### Run Specific Test Suite

\`\`\`bash
npx jest cinema-integration.spec.ts
npx jest user-journey.spec.ts
npx jest movie-booking-flow.spec.ts
\`\`\`

### Run with Coverage

\`\`\`bash
npm run test:integration:report
\`\`\`

## Test Data Requirements

### Seeded Data Needed:

- ✅ Movies: 30 movies with genres
- ✅ Cinemas: 6 cinemas across Vietnam (HCM, Hanoi)
- ✅ Halls: 31 halls with different types (IMAX, VIP, Standard)
- ✅ Seats: 4,600 seats with proper layout
- ✅ Showtimes: 765 showtimes over 7 days
- ✅ Reviews: Cinema reviews and ratings

### API Endpoints Tested:

- \`GET /api/v1/movies\` - Browse movies
- \`GET /api/v1/movies/{id}\` - Movie details
- \`GET /api/v1/genres\` - Available genres
- \`GET /api/v1/cinemas\` - All cinemas
- \`GET /api/v1/cinemas/nearby\` - Location-based search
- \`GET /api/v1/cinemas/search\` - Cinema search
- \`GET /api/v1/cinemas/{cinemaId}/movies/{movieId}/showtimes\` - Showtimes
- \`GET /api/v1/showtimes/{id}/seats\` - Seat layout
- \`GET /api/v1/cinemas/locations/cities\` - Location filters
- \`GET /api/v1/cinemas/locations/districts\` - District filters

## Expected Test Results

### Successful Test Run Should Show:

1. **Movie Discovery**: ✅ 30+ movies available
2. **Location Services**: ✅ 6 cinemas found near test locations
3. **Showtime Integration**: ✅ 765+ showtimes available across dates
4. **Seat Selection**: ✅ 4,600+ seats with proper availability
5. **Error Handling**: ✅ Proper HTTP status codes for invalid requests
6. **Performance**: ✅ All API calls under 2 seconds

### Sample Output:

\`\`\`
🎬 User opens the movie booking app...
✅ User selected movie: Ám Ảnh Kinh Hoàng: Nghi Lễ Cuối Cùng
Runtime: 135 minutes
Rating: P

🗺️ User enables location to find nearby cinemas...
✅ Found 3 nearby cinemas

1.  CGV Vincom Center Landmark 81 - Bình Thạnh, Hồ Chí Minh
    Rating: 4.5/5 (1250 reviews)

🕐 User looks for showtime options...
✅ Found 4 showtimes for today

💺 User opens seat selection...
✅ Seat layout loaded:
Total seats: 180
Available: 165
Occupied: 15

# 🎫 Booking Summary:

🎬 Movie: Ám Ảnh Kinh Hoàng: Nghi Lễ Cuối Cùng
🏢 Cinema: CGV Vincom Center Landmark 81
💺 Seats: A5, A6
💰 Total: 160,000 VND
=====================================
\`\`\`

## Troubleshooting

### Common Issues:

1. **Services Not Running**
   \`\`\`
   Error: connect ECONNREFUSED 127.0.0.1:4000
   \`\`\`
   **Solution**: Start services with \`docker compose up -d\`

2. **No Showtimes Found**
   \`\`\`
   ⚠️ No showtimes available for today
   \`\`\`
   **Solution**: Tests automatically check tomorrow if today has no showtimes

3. **No Available Seats**
   \`\`\`
   Expected at least 2 available seats
   \`\`\`
   **Solution**: Re-run cinema seeding script to reset seat availability

4. **Database Connection Issues**
   \`\`\`
   Can't reach database server
   \`\`\`
   **Solution**: Ensure PostgreSQL containers are healthy

## Configuration

### Environment Variables:

- \`API_GATEWAY_URL\`: Base URL for API Gateway (default: http://localhost:4000)

### Test Timeouts:

- Default: 15 seconds per test
- Configured in: \`axios.defaults.timeout = 15000\`

### Test Data:

- Location: Ho Chi Minh City area (Landmark 81 coordinates)
- User Flow: 2 adjacent seats selection
- Price Range: 72,000 - 160,000 VND per seat
