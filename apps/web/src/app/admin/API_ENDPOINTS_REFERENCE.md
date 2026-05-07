# 📚 COMPLETE API ENDPOINT REFERENCE

**For:** Admin Dashboard Integration  
**Date:** 2025-12-17  
**Source:** Backend code verification from /apps/api-gateway/src/app/module/

---

## 🎬 MOVIES API

**Module:** `/api/v1/movies`  
**Controller:** [movie/controller/movie.controller.ts](apps/api-gateway/src/app/module/movie/controller/movie.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters |
|----------|--------|---------|--------|-----------|
| `/movies` | GET | List movies | ✅ Ready | page, limit, sortBy, sortOrder, status |
| `/movies/:id` | GET | Get movie detail | ✅ Ready | id |
| `/movies` | POST | Create movie | ✅ Ready | title, overview, posterUrl, trailerUrl, runtime, releaseDate, ageRating, originalLanguage, spokenLanguages, languageType, director, genreIds, cast |
| `/movies/:id` | PUT | Update movie | ✅ Ready | (same as POST) |
| `/movies/:id` | DELETE | Delete movie | ✅ Ready | id |

---

## 🎭 GENRES API

**Module:** `/api/v1/genres`  
**Controller:** [movie/controller/genre.controller.ts](apps/api-gateway/src/app/module/movie/controller/genre.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters |
|----------|--------|---------|--------|-----------|
| `/genres` | GET | List genres | ✅ Ready | - |
| `/genres` | POST | Create genre | ✅ Ready | name |
| `/genres/:id` | GET | Get genre detail | ✅ Ready | id |
| `/genres/:id` | PUT | Update genre | ✅ Ready | name |
| `/genres/:id` | DELETE | Delete genre | ✅ Ready | id |

---

## 🏢 CINEMAS API

**Module:** `/api/v1/cinemas`  
**Controller:** [cinema/controller/cinema.controller.ts](apps/api-gateway/src/app/module/cinema/controller/cinema.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters |
|----------|--------|---------|--------|-----------|
| `/cinemas/filters` | GET | List cinemas (advanced filters) | ✅ Ready | page, limit, city, district, lat, lon, amenities, hallTypes, sortBy, sortOrder |
| `/cinemas/search` | GET | Search cinemas | ✅ Ready | query, latitude, longitude |
| `/cinemas/nearby` | GET | Get nearby cinemas | ✅ Ready | latitude, longitude, radius |
| `/cinemas/locations/cities` | GET | List cities | ✅ Ready | - |
| `/cinemas/locations/districts` | GET | List districts | ✅ Ready | city |
| `/cinemas/:id` | GET | Get cinema detail | ✅ Ready | id |
| `/cinemas/cinema` | POST | Create cinema | ✅ Ready | name, address, city, district, phone, email, amenities, coordinates |
| `/cinemas/cinema/:cinemaId` | PATCH | Update cinema | ✅ Ready | name, address, city, district, phone, email, amenities, coordinates |
| `/cinemas/cinema/:cinemaId` | DELETE | Delete cinema | ✅ Ready | cinemaId |
| `/cinemas/:cinemaId/movies` | GET | List movies at cinema | ✅ Ready | cinemaId |
| `/cinemas/:cinemaId/movies/:movieId/showtimes` | GET | Get showtimes (user view) | ✅ Ready | cinemaId, movieId |
| `/cinemas/:cinemaId/movies/:movieId/showtimes/admin` | GET | Get showtimes (admin view) | ✅ Ready | cinemaId, movieId, filters |

---

## 🚪 HALLS API

**Module:** `/api/v1/halls`  
**Controller:** [cinema/controller/hall.controller.ts](apps/api-gateway/src/app/module/cinema/controller/hall.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters | Notes |
|----------|--------|---------|--------|-----------|-------|
| `/halls/cinema/:cinemaId` | GET | List halls by cinema | ✅ Ready | cinemaId | Returns array of halls for cinema |
| `/halls/hall/:hallId` | GET | Get hall detail | ✅ Ready | hallId | Includes seat map |
| `/halls` | GET | List all halls | ❌ Missing | - | **Workaround:** Use GET /cinemas + loop GET /halls/cinema/:id |
| `/halls/hall` | POST | Create hall | ✅ Ready | cinemaId, name, type, rows, columns, capacity, amenities |
| `/halls/hall/:hallId` | PATCH | Update hall | ✅ Ready | name, type, amenities |
| `/halls/hall/:hallId` | DELETE | Delete hall | ✅ Ready | hallId |
| `/halls/seat/:seatId/status` | PATCH | Update seat status | ✅ Ready | status (ACTIVE/BROKEN/MAINTENANCE) |

---

## 💰 TICKET PRICING API

**Module:** `/api/v1/ticket-pricings`  
**Controller:** [cinema/controller/ticket-pricing.controller.ts](apps/api-gateway/src/app/module/cinema/controller/ticket-pricing.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters |
|----------|--------|---------|--------|-----------|
| `/ticket-pricings/hall/:hallId` | GET | Get pricing tiers for hall | ✅ Ready | hallId |
| `/ticket-pricings/pricing/:pricingId` | PATCH | Update price | ✅ Ready | price |

**Response Format:**
```typescript
{
  id: string
  hallId: string
  seatType: string  // "STANDARD", "VIP", "COUPLE"
  dayType: string   // "REGULAR", "WEEKEND", "HOLIDAY"
  price: number
}
```

---

## ⏰ SHOWTIMES API

**Module:** `/api/v1/showtimes`  
**Controller:** [cinema/controller/showtime.controller.ts](apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters | Notes |
|----------|--------|---------|--------|-----------|-------|
| `/showtimes` | GET | Test endpoint | ✅ Ready | - | Returns "Oke" |
| `/showtimes/:id/seats` | GET | Get showtime seats layout | ✅ Ready | showtimeId | Includes seat prices + reservation status |
| `/showtimes/showtime/:showtimeId/ttl` | GET | Get session TTL | ✅ Ready | showtimeId | For seat hold timing |
| `/showtimes` (admin) | GET | **List showtimes (admin)** | ❌ Missing | date, cinema, movie | **Workaround:** Only available via cinema+movie path |
| `/showtimes/showtime` | POST | Create showtime | ✅ Ready | movieId, releaseId, cinemaId, hallId, startTime, format, language |
| `/showtimes/batch` | POST | Batch create showtimes | ✅ Ready | movieId, releaseId, cinemaId, hallId, startTime, repeatPattern (DAILY/WEEKLY), endDate |
| `/showtimes/showtime/:id` | PATCH | Update showtime | ✅ Ready | startTime, format, language |
| `/showtimes/showtime/:id` | DELETE | Cancel/delete showtime | ✅ Ready | id |

**Note:** Flexible filtering endpoint missing - current implementation requires cinemaId + movieId always

---

## 🎬 MOVIE RELEASES API

**Module:** `/api/v1/movie-releases`  
**Controller:** [movie/controller/movie-release.controller.ts](apps/api-gateway/src/app/module/movie/controller/movie-release.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters |
|----------|--------|---------|--------|-----------|
| `/movies/:id/releases` | GET | List releases for movie | ✅ Ready | movieId |
| `/movie-releases` | POST | Create release | ✅ Ready | movieId, startDate, endDate, status, note |
| `/movie-releases/:id` | PUT | Update release | ✅ Ready | startDate, endDate, status, note |
| `/movie-releases/:id` | DELETE | Delete release | ✅ Ready | id |

---

## 📋 BOOKINGS/RESERVATIONS API

**Module:** `/api/v1/bookings`  
**Controller:** [booking/controller/booking.controller.ts](apps/api-gateway/src/app/module/booking/controller/booking.controller.ts)

### User Endpoints (not admin focus)
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/bookings` | POST | Create booking | ✅ Ready |
| `/bookings` | GET | List user bookings | ✅ Ready |
| `/bookings/:id` | GET | Get booking detail | ✅ Ready |
| `/bookings/:id/summary` | GET | Get booking summary | ✅ Ready |

### Admin Endpoints
| Endpoint | Method | Purpose | Status | Parameters |
|----------|--------|---------|--------|-----------|
| `/bookings/admin/all` | GET | List all bookings | ✅ Ready | status, startDate, endDate, page, limit |
| `/bookings/admin/showtime/:showtimeId` | GET | Bookings for showtime | ✅ Ready | showtimeId |
| `/bookings/admin/date-range` | GET | Bookings by date range | ✅ Ready | startDate, endDate |
| `/bookings/admin/:id/status` | PUT | Update booking status | ✅ Ready | status (CONFIRMED/CANCELLED/REFUNDED) |
| `/bookings/admin/:id/confirm` | POST | Confirm booking | ✅ Ready | - |
| `/bookings/admin/:id/complete` | POST | Complete booking | ✅ Ready | - |
| `/bookings/admin/:id/expire` | POST | Expire booking | ✅ Ready | - |
| `/bookings/admin/statistics` | GET | Revenue statistics | ✅ Ready | startDate, endDate |
| `/bookings/admin/revenue-report` | GET | Revenue report | ✅ Ready | startDate, endDate, groupBy (day/week/month/cinema) |

**Admin Statistics Response:**
```typescript
{
  totalBookings: number
  totalRevenue: number
  avgValue: number
  byStatus: { [status]: count }
  byPaymentStatus: { [status]: count }
  topConcessions: [{ name, count, revenue }]
  topPromotions: [{ name, count, discount }]
}
```

**Admin Revenue Report Response:**
```typescript
{
  total: number
  byTicket: number
  byConcession: number
  discount: number
  refund: number
  net: number
  revenueByPeriod: [{ period, revenue }]
}
```

---

## 👥 USERS API

**Module:** `/api/v1/users`  
**Controller:** [user/controller/user.controller.ts](apps/api-gateway/src/app/module/user/controller/user.controller.ts)

| Endpoint | Method | Purpose | Status | Parameters | Note |
|----------|--------|---------|--------|-----------|------|
| `/users` | GET | List all users | ✅ Ready | - | Returns all Clerk users |
| `/users/:id` | GET | Get user detail | ✅ Ready | id | - |

**Note:** This endpoint returns generic Clerk users without role/cinema filtering. Staff-specific endpoints are MISSING.

---

## ❌ MISSING MODULES

### Staff Management
```
❌ GET /api/v1/staff?role=MANAGER&status=ACTIVE&cinemaId=xxx
❌ POST /api/v1/staff
❌ PATCH /api/v1/staff/:id
❌ DELETE /api/v1/staff/:id
```
**Status:** Completely missing - NO ENDPOINTS IN BACKEND

### Reviews Management
```
❌ GET /api/v1/reviews?status=ACTIVE&rating=5&movieId=xxx
❌ GET /api/v1/reviews/:id
❌ PATCH /api/v1/reviews/:id/status
❌ DELETE /api/v1/reviews/:id
```
**Status:** Completely missing - NO ENDPOINTS IN BACKEND

### Reports Analytics (Partial)
```
✅ GET /api/v1/bookings/admin/revenue-report (partial - groupBy may not work)
❌ GET /api/v1/reports/revenue-by-cinema
❌ GET /api/v1/reports/revenue-by-movie
❌ GET /api/v1/reports/occupancy
❌ GET /api/v1/reports/ticket-sales-by-type
❌ GET /api/v1/reports/peak-hours
```
**Status:** 1 of 6 endpoints - Others missing

### Admin Profile & Settings
```
❌ GET /api/v1/admin/profile
❌ PATCH /api/v1/admin/profile
❌ POST /api/v1/admin/upload-avatar
❌ GET /api/v1/admin/settings/notifications
❌ PATCH /api/v1/admin/settings/notifications
❌ POST /api/v1/admin/change-password
❌ POST /api/v1/admin/2fa/enable
❌ GET /api/v1/admin/sessions
❌ GET /api/v1/admin/settings/appearance
❌ PATCH /api/v1/admin/settings/appearance
❌ GET /api/v1/admin/settings/system
❌ PATCH /api/v1/admin/settings/system
```
**Status:** Completely missing - ALL PROFILE/SETTINGS ENDPOINTS IN BACKEND

---

## 📊 ENDPOINT SUMMARY TABLE

| Module | Total Endpoints | Ready | Missing | Partial |
|--------|-----------------|-------|---------|---------|
| Movies | 5 | 5 | 0 | 0 |
| Genres | 5 | 5 | 0 | 0 |
| Cinemas | 13 | 12 | 1 | 0 |
| Halls | 8 | 7 | 1 | 0 |
| Ticket Pricing | 2 | 2 | 0 | 0 |
| Showtimes | 8 | 7 | 1 | 0 |
| Movie Releases | 4 | 4 | 0 | 0 |
| Bookings | 13 | 13 | 0 | 0 |
| Users | 2 | 2 | 0 | 0 |
| **Subtotal** | **60** | **57** | **3** | **0** |
| Staff | 4 | 0 | 4 | 0 |
| Reviews | 4 | 0 | 4 | 0 |
| Reports | 6 | 1 | 5 | 0 |
| Settings | 12 | 0 | 12 | 0 |
| **TOTAL** | **86** | **58** | **28** | **0** |

---

## 🔗 QUICK REFERENCE BY PAGE

### Phase 1 - Ready Now
- **Movies:** Use endpoints: GET/POST/PUT/DELETE /movies
- **Genres:** Use endpoints: GET/POST/PUT/DELETE /genres
- **Cinemas:** Use endpoints: GET /cinemas/filters, POST/PATCH/DELETE /cinemas/cinema
- **Halls:** Use endpoints: GET /halls/cinema/:id (workaround for list), CRUD /halls/hall, PATCH /halls/seat/:id/status
- **Pricing:** Use endpoints: GET /ticket-pricings/hall/:id, PATCH /ticket-pricings/pricing/:id
- **Releases:** Use endpoints: GET/POST/PUT/DELETE /movie-releases
- **Batch Showtimes:** Use endpoints: GET /cinemas, GET /movies, GET /halls/cinema/:id, POST /showtimes/batch
- **Seat Status:** Use endpoints: GET /halls/hall/:id, PATCH /halls/seat/:id/status

### Phase 2 - Workaround Available
- **Showtimes:** Workaround needed - See BACKEND_VERIFICATION_REPORT.md
- **Showtime-Seats:** Same workaround as Showtimes
- **Reservations:** Use endpoints: GET /bookings/admin/all, GET /bookings/:id/summary, PUT /bookings/admin/:id/status

### Phase 3 - Blocked
- **Staff:** All endpoints missing - Contact backend team
- **Reviews:** All endpoints missing - Use mock data or wait for backend
- **Reports:** 5 endpoints missing - Use workaround or wait for backend
- **Settings:** All endpoints missing - Use localStorage workaround

---

**Document Generated:** 2025-12-17  
**For Questions:** See API_INTEGRATION_BREAKDOWN.md for detailed per-page analysis
