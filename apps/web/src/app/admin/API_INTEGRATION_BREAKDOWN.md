# 📋 API INTEGRATION BREAKDOWN - By Screen

**Document Version:** 1.1 (VERIFIED)
**Created:** 2025-12-17  
**Last Verified:** 2025-12-17 (Backend codebase checked)
**Purpose:** Detailed API requirements for each admin dashboard screen with feasibility assessment  
**Basis:** API_ALIGNMENT_GUIDE.md + Page structure analysis + **VERIFIED AGAINST ACTUAL BACKEND CODE**

---

## ✅ VERIFICATION STATUS

**Agent Verification Completed Against Backend Controllers:**
- ✅ Checked [apps/api-gateway/src/app/module/](apps/api-gateway/src/app/module/) controllers
- ✅ Verified all endpoint routes, HTTP methods, parameters
- ✅ Documented exact API paths and requirements
- ✅ Identified 21 missing backend APIs
- ✅ Documented viable workarounds for 3 APIs

**Verification Summary Added To:**
- Each module's "Implementation Notes" section → includes file paths with `✅ Kiểm Chứng Backend:`
- Quick Summary table → updated with verification results
- Missing APIs clearly marked with `❌ NOT FOUND` and controller references

---

## 📊 Quick Summary

| Tính Trạng | Module | Số Trang | Ghi Chú |
|-----------|--------|---------|---------|
| ✅ Đủ API 100% | 8 | Movies, Genres, Cinemas, Halls, Seat-Status, Movie-Releases, Ticket-Pricing, Batch-Showtimes | ✅ Kiểm chứng: Đúng - tất cả controllers đã có |
| ⚠️ Cần Workaround | 3 | Halls-List, Showtimes, Showtime-Seats | ✅ Kiểm chứng: Đúng - cần combine API calls |
| ❌ Thiếu API | 4 | **Reviews, Staff, Reports, Settings** | ❌ Kiểm chứng: **Không có endpoints cho các module này** |

---

## 🎬 MOVIES PAGE
**Route:** `/dashboard/movies`

### Current Functionality
- [x] List all movies (paginated)
- [x] Search by title
- [x] Create new movie
- [x] Edit movie
- [x] Delete movie
- [x] View movie details
- [x] Add release for movie

### Page Layout & Action Points

```
┌─────────────────────────────────────────────────────────────┐
│ MOVIES PAGE                                                 │
├─────────────────────────────────────────────────────────────┤
│ [Search Box] [+ ADD NEW MOVIE]                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Movie List (Paginated)                                   │
│ │  Movie Card 1                                             │
│ │  ├─ [Edit] [Delete] [⋮ More]                              │
│ │  │                    └─ Add Release → opens dialog       │
│ │  ├─ Genre: Action, Sci-Fi                                 │
│ │  └─ Status: NOW_SHOWING                                   │
│ │                                                            │
│ │  Movie Card 2...                                          │
│ └─ Pagination: [< 1 2 3 >]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status |
|---|----------|--------|----------|--------|--------|
| **1** | **Page Load** | Load all movies with pagination | `GET /api/v1/movies?page=1&limit=20` | 1.1 | ✅ Ready |
| **2** | **Search Box** | Filter/search movies by title | Local filter or `GET /api/v1/movies?search=query` | 1.1 | ✅ Ready |
| **3** | **[+ ADD NEW MOVIE] Button** | Open create dialog with genre dropdown | `GET /api/v1/genres` | 2.1 | ✅ Ready |
| **4** | **Create Dialog → [Save]** | Create new movie | `POST /api/v1/movies` with form data | 1.2 | ✅ Ready |
| **5** | **Movie Card [Edit]** | Open edit dialog pre-filled with data | `GET /api/v1/genres` for dropdown | 2.1 | ✅ Ready |
| **6** | **Edit Dialog → [Save]** | Update movie | `PUT /api/v1/movies/:id` | 1.3 | ✅ Ready |
| **7** | **Movie Card [Delete]** | Open delete confirmation dialog | No API call needed | - | - |
| **8** | **Delete Dialog → [Confirm]** | Delete movie | `DELETE /api/v1/movies/:id` | 1.4 | ✅ Ready |
| **9** | **Movie Card [⋮] → Add Release** | Open movie release dialog | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready |
| **10** | **Release Dialog → [Create]** | Create release for this movie | `POST /api/v1/movie-releases` | 6.2 | ✅ Ready |
| **11** | **Pagination Buttons** | Load next/previous page | `GET /api/v1/movies?page=N&limit=20` | 1.1 | ✅ Ready |

### Form Submission Examples

**Create Movie (Action #4):**
```typescript
POST /api/v1/movies
{
  "title": "Avatar 3",
  "overview": "Description...",
  "posterUrl": "https://...",
  "trailerUrl": "https://...",
  "runtime": 192,
  "releaseDate": "2025-12-20",
  "ageRating": "T13",
  "originalLanguage": "en",
  "spokenLanguages": ["en", "vi"],
  "languageType": "SUBTITLE",
  "director": "James Cameron",
  "genreIds": ["g_001", "g_005"],  // Action, Sci-Fi
  "cast": [...]
}
```

**Add Release from Movie (Action #10):**
```typescript
POST /api/v1/movie-releases
{
  "movieId": "m_123",
  "startDate": "2025-12-20",
  "endDate": "2026-02-28",
  "status": "UPCOMING",
  "note": "Winter release"
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:** [apps/api-gateway/src/app/module/movie/controller/movie.controller.ts](apps/api-gateway/src/app/module/movie/controller/movie.controller.ts) - Tất cả endpoints `GET /movies`, `POST /movies`, `PUT /movies/:id`, `DELETE /movies/:id` đã được implement. Response format: `{ success, message, data, timestamp }`
- Currently using mock data from `mockData.ts`, switch to real API calls
- Recommend pagination: implement `page` & `limit` query params
- Genres dropdown should be fetched when opening create/edit dialog
- Add Release button should navigate to movie-releases page or open inline dialog

---

## 🎭 GENRES PAGE
**Route:** `/dashboard/genres`

### Current Functionality
- [x] List all genres
- [x] Create genre
- [x] Edit genre
- [x] Delete genre

### Page Layout & Action Points

```
┌─────────────────────────────────────┐
│ GENRES PAGE                         │
├─────────────────────────────────────┤
│ [+ ADD NEW GENRE]                   │
├─────────────────────────────────────┤
│ Genre List (Simple table)           │
│ ┌─────────────────────────────────┐ │
│ │ Action | Comedy | Drama | ... │ │
│ │ [Edit] [Delete]                 │ │
│ ├─────────────────────────────────┤ │
│ │ Adventure | [Edit] [Delete]     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status |
|---|----------|--------|----------|--------|--------|
| **1** | **Page Load** | Load all genres | `GET /api/v1/genres` | 2.1 | ✅ Ready |
| **2** | **[+ ADD NEW GENRE] Button** | Open create dialog | No API call | - | - |
| **3** | **Create Dialog → [Save]** | Create new genre | `POST /api/v1/genres` | 2.2 | ✅ Ready |
| **4** | **Genre Row [Edit]** | Open edit dialog pre-filled | No API call | - | - |
| **5** | **Edit Dialog → [Save]** | Update genre | `PUT /api/v1/genres/:id` | 2.3 | ✅ Ready |
| **6** | **Genre Row [Delete]** | Open delete confirmation | No API call | - | - |
| **7** | **Delete Dialog → [Confirm]** | Delete genre | `DELETE /api/v1/genres/:id` | 2.4 | ✅ Ready |

### Form Submission Examples

**Create Genre (Action #3):**
```typescript
POST /api/v1/genres
{
  "name": "Adventure"
}
```

**Update Genre (Action #5):**
```typescript
PUT /api/v1/genres/g_001
{
  "name": "Action & Adventure"
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:** [apps/api-gateway/src/app/module/movie/controller/genre.controller.ts](apps/api-gateway/src/app/module/movie/controller/genre.controller.ts) - Tất cả endpoints `GET /genres`, `POST /genres`, `PUT /genres/:id`, `DELETE /genres/:id` đã có
- Simple CRUD module - straightforward implementation
- No external dependencies
- Currently using mock data, replace with real API

---

## 🏢 CINEMAS PAGE
**Route:** `/dashboard/cinemas`

### Current Functionality
- [x] List all cinemas
- [x] Search by name/city
- [x] Create cinema
- [x] Edit cinema
- [x] Delete cinema
- [x] View cinema details

### Page Layout & Action Points

```
┌──────────────────────────────────────────────┐
│ CINEMAS PAGE                                 │
├──────────────────────────────────────────────┤
│ [Search Box] [+ ADD NEW CINEMA]              │
├──────────────────────────────────────────────┤
│ Cinema List (Cards)                          │
│ ┌─ CGV Vincom                                │
│ │ ├─ Address: Vincom Center                  │
│ │ ├─ City: Hanoi | District: Ba Dinh        │
│ │ ├─ Phone: ... | Email: ...                 │
│ │ └─ [Edit] [Delete] [⋮]                     │
│ │                                             │
│ └─ Lotte Cinema Diamond                      │
│   └─ ...                                     │
└──────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status |
|---|----------|--------|----------|--------|--------|
| **1** | **Page Load** | Load all cinemas | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready |
| **2** | **Search Box** | Filter cinemas by name/city/district | Local filter or query params | 3.1 | ✅ Ready |
| **3** | **[+ ADD NEW CINEMA] Button** | Open create dialog | No API call | - | - |
| **4** | **Create Dialog → [Save]** | Create new cinema | `POST /api/v1/cinemas/cinema` | 3.2 | ✅ Ready |
| **5** | **Cinema Card [Edit]** | Open edit dialog pre-filled | No API call | - | - |
| **6** | **Edit Dialog → [Save]** | Update cinema | `PATCH /api/v1/cinemas/cinema/:cinemaId` | 3.3 | ✅ Ready |
| **7** | **Cinema Card [Delete]** | Open delete confirmation | No API call | - | - |
| **8** | **Delete Dialog → [Confirm]** | Delete cinema | `DELETE /api/v1/cinemas/cinema/:cinemaId` | 3.4 | ✅ Ready |

### Form Submission Examples

**Create Cinema (Action #4):**
```typescript
POST /api/v1/cinemas/cinema
{
  "name": "CGV Vincom Center",
  "address": "191 Ba Trieu, Hanoi",
  "city": "Hanoi",
  "district": "Ba Dinh",
  "phone": "+84912345678",
  "email": "cgv@vincom.vn",
  "amenities": ["wifi", "parking", "food_court"],
  "coordinates": { "latitude": 21.0285, "longitude": 105.8581 }
}
```

**Update Cinema (Action #6):**
```typescript
PATCH /api/v1/cinemas/cinema/c_001
{
  "name": "CGV Vincom Center - Updated",
  "phone": "+84912345679",
  "amenities": ["wifi", "parking"]
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:** [apps/api-gateway/src/app/module/cinema/controller/cinema.controller.ts](apps/api-gateway/src/app/module/cinema/controller/cinema.controller.ts) - Tất cả endpoints `GET /cinemas/filters`, `POST /cinemas/cinema`, `PATCH /cinemas/cinema/:cinemaId`, `DELETE /cinemas/cinema/:cinemaId` đã có. Endpoint `/filters` hỗ trợ advanced filtering (lat/lon, city, district, amenities, hallTypes, pagination, sorting)
- Note the endpoint pattern: `/cinema` for single resource operations (POST, PATCH, DELETE)
- Search: Filter locally from GET response or use query params if backend supports
- Currently using mock data, replace with real API

---

## 🚪 HALLS PAGE  
**Route:** `/dashboard/halls`

### Current Functionality
- [x] List all halls organized by cinema
- [x] Filter by cinema
- [x] Search by hall name
- [x] Create hall
- [x] Edit hall
- [x] Delete hall
- [x] View seat map

### Page Layout & Action Points

```
┌──────────────────────────────────────────────┐
│ HALLS PAGE                                   │
├──────────────────────────────────────────────┤
│ [Search Box] [+ ADD NEW HALL]                │
├──────────────────────────────────────────────┤
│ Halls Grouped by Cinema                      │
│ ┌─ CGV VINCOM CENTER (3 halls)               │
│ │  Hall A                                    │
│ │  ├─ Type: 2D | Capacity: 120 seats        │
│ │  ├─ Layout: 10 rows × 12 cols             │
│ │  └─ [Edit] [Delete]                       │
│ │                                            │
│ │  Hall B (IMAX) [Edit] [Delete]            │
│ │  Hall C (4DX) [Edit] [Delete]             │
│ │                                            │
│ └─ Lotte Cinema Diamond (2 halls)            │
│    └─ ...                                   │
└──────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load all halls grouped by cinema | **Workaround:** (1) `GET /api/v1/cinemas/filters` (2) Loop: `GET /api/v1/halls/cinema/:cinemaId` (3) Merge results | 3.1 + 5.2 | ⚠️ Workaround | See implementation pattern below |
| **2** | **Search Box** | Filter halls by name | Local filter | - | - | Filter from already loaded data |
| **3** | **[+ ADD NEW HALL] Button** | Open create dialog with cinema dropdown | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | Fetch on dialog open |
| **4** | **Create Dialog → Cinema Select** | Load halls list (to show where new hall belongs) | `GET /api/v1/halls/cinema/:cinemaId` | 5.2 | ✅ Ready | Fetch when cinema selected |
| **5** | **Create Dialog → [Save]** | Create new hall | `POST /api/v1/halls/hall` | 4.3 | ✅ Ready | Includes layout info |
| **6** | **Hall Card [Edit]** | Open edit dialog with details | No API call (data loaded) | - | - | Use data from initial load |
| **7** | **Edit Dialog → [Save]** | Update hall | `PATCH /api/v1/halls/hall/:hallId` | 4.4 | ✅ Ready | Update hall properties |
| **8** | **Hall Card [Delete]** | Open delete confirmation | No API call | - | - | - |
| **9** | **Delete Dialog → [Confirm]** | Delete hall | `DELETE /api/v1/halls/hall/:hallId` | 4.5 | ✅ Ready | - |
| **10** | **View Hall Details (click card)** | Load full seat map | `GET /api/v1/halls/hall/:hallId` | 4.2 | ✅ Ready | For seat map visualization |

### Workaround Implementation Pattern (Action #1)

```typescript
// Step 1: Load all cinemas
const cinemas = await fetch('/api/v1/cinemas/filters')

// Step 2: Load halls for each cinema
const hallsByCinema = {}
for (const cinema of cinemas) {
  const halls = await fetch(`/api/v1/halls/cinema/${cinema.id}`)
  hallsByCinema[cinema.id] = {
    cinema: cinema,
    halls: halls
  }
}

// Step 3: Display grouped by cinema
Object.entries(hallsByCinema).map(([cinemaId, { cinema, halls }]) => (
  <div>
    <h3>{cinema.name}</h3>
    {halls.map(hall => <HallCard {...hall} />)}
  </div>
))
```

### Form Submission Examples

**Create Hall (Action #5):**
```typescript
POST /api/v1/halls/hall
{
  "cinemaId": "c_001",
  "name": "Hall A",
  "type": "2D",           // 2D, IMAX, 4DX, 3D, etc
  "capacity": 120,
  "rows": 10,
  "cols": 12,
  "hallCode": "HALL_A_001"
}
```

**Update Hall (Action #7):**
```typescript
PATCH /api/v1/halls/hall/h_001
{
  "name": "Hall A (Premium)",
  "capacity": 100,
  "type": "IMAX"
}
```

### Get Hall Details (Action #10)

**Response from `GET /api/v1/halls/hall/:hallId` (ID 4.2):**
```typescript
{
  "id": "h_001",
  "cinemaId": "c_001",
  "name": "Hall A",
  "type": "2D",
  "capacity": 120,
  "rows": 10,
  "cols": 12,
  "seats": [
    {
      "id": "s_001",
      "row": "A",
      "seatNumber": "1",
      "type": "STANDARD",
      "status": "ACTIVE"
    },
    {
      "id": "s_002",
      "row": "A",
      "seatNumber": "2",
      "type": "VIP",
      "status": "ACTIVE"
    }
    // ... more seats
  ]
}
```

### Backend Enhancement (Verified Against Code)
- ✅ **Kiểm Chứng Backend:** 
  - [apps/api-gateway/src/app/module/cinema/controller/hall.controller.ts](apps/api-gateway/src/app/module/cinema/controller/hall.controller.ts) - Tất cả CRUD endpoints có sẵn
  - ⚠️ **Thiếu API 4.1:** Backend chỉ có `GET /halls/cinema/:cinemaId`, không có global `GET /halls` để list all halls
  - **Workaround:** Fetch all cinemas first, then loop through each cinema ID to get its halls. Viable but requires N+1 API calls (1 for cinemas + 1 per cinema)
  - **Recommendation:** Request backend to add optional filter: `GET /api/v1/halls?cinemaId=xxx` (return all halls if param omitted)

### Implementation Notes
- ⚠️ **Workaround Required** - See Backend Enhancement section above
- Currently using mock data, implement workaround once real API ready
- Consider caching cinema + halls data to minimize API calls
- Hall seat map can be fetched on-demand when viewing details

---

## ⏰ SHOWTIMES PAGE
**Route:** `/dashboard/showtimes`

### Current Functionality
- [x] List showtimes by date/cinema/movie
- [x] Filter by cinema, movie, date
- [x] Create single showtime
- [x] Edit showtime
- [x] Delete showtime
- [x] Bulk export (optional)

### Page Layout & Action Points

```
┌─────────────────────────────────────────────────────┐
│ SHOWTIMES PAGE                                      │
├─────────────────────────────────────────────────────┤
│ [Date Picker] [Cinema ▼] [Movie ▼] [⚡ Refresh]    │
├─────────────────────────────────────────────────────┤
│ Showtimes List for Selected Filters                 │
│ ┌─ 2025-12-20                                       │
│ │  Avatar 3 @ CGV Vincom - Hall A                   │
│ │  10:00 AM (2D Vietnamese) ───► 200,000 VND       │
│ │  [Edit] [Delete] [⋮ View Seats]                  │
│ │                                                   │
│ │  Avatar 3 @ CGV Vincom - Hall B                   │
│ │  14:30 (IMAX English) [Edit] [Delete]            │
│ │                                                   │
│ └─ ... more showtimes                              │
│                                                     │
│ [+ ADD SINGLE SHOWTIME] [⏱️ BATCH CREATE ...]      │
└─────────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load (with default filters)** | Load showtimes | **Workaround:** See pattern below | 5.1 | ⚠️ Workaround | Need flexible API 5.1 |
| **2** | **Cinema Dropdown** | Load all cinemas | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | - |
| **3** | **Movie Dropdown** | Load all movies | `GET /api/v1/movies` | 1.1 | ✅ Ready | - |
| **4** | **Date Picker** | Change date filter | Trigger re-fetch with new date | 5.1 | ⚠️ Workaround | - |
| **5** | **[⚡ Refresh Button]** | Reload showtimes with current filters | Re-fetch with current filters | 5.1 | ⚠️ Workaround | - |
| **6** | **[+ ADD SINGLE SHOWTIME]** | Open create dialog | `GET /api/v1/halls/cinema/:cinemaId` | 5.2 | ✅ Ready | Load halls for selected cinema |
| **7** | **Create Dialog → [Save]** | Create single showtime | `POST /api/v1/showtimes/showtime` | 5.3 | ✅ Ready | See form example |
| **8** | **Showtime Row [Edit]** | Open edit dialog | No API call (data loaded) | - | - | Use existing data |
| **9** | **Edit Dialog → [Save]** | Update showtime | `PATCH /api/v1/showtimes/showtime/:id` | 5.5 | ✅ Ready | Partial update |
| **10** | **Showtime Row [Delete]** | Open delete confirmation | No API call | - | - | - |
| **11** | **Delete Dialog → [Confirm]** | Delete showtime | `DELETE /api/v1/showtimes/showtime/:id` | 5.6 | ✅ Ready | Cancel showtime |
| **12** | **Showtime Row [View Seats]** | Show seat map for this showtime | `GET /api/v1/showtimes/:id/seats` | 5.7 | ✅ Ready | Open seat view modal |
| **13** | **[⏱️ BATCH CREATE ...]** | Navigate to batch showtimes page | Navigation only | - | - | Router push |

### Workaround Implementation Pattern (Action #1)

**Problem:** Current API requires BOTH cinemaId & movieId: `GET /api/v1/cinemas/:cinemaId/movies/:movieId/showtimes/admin`

**Frontend Workaround:**

```typescript
async function getShowtimesWithFilters(date: Date, cinemaId?: string, movieId?: string) {
  // 1. Get all cinemas if not filtered
  const allCinemas = await fetch('/api/v1/cinemas/filters')
  const targetCinemas = cinemaId 
    ? allCinemas.filter(c => c.id === cinemaId) 
    : allCinemas

  // 2. Get all movies if not filtered
  const allMovies = await fetch('/api/v1/movies')
  const targetMovies = movieId 
    ? allMovies.filter(m => m.id === movieId) 
    : allMovies

  // 3. Fetch showtimes for each cinema-movie combination
  const allShowtimes = []
  for (const cinema of targetCinemas) {
    for (const movie of targetMovies) {
      try {
        const showtimes = await fetch(
          `/api/v1/cinemas/${cinema.id}/movies/${movie.id}/showtimes/admin`
        )
        allShowtimes.push(...showtimes)
      } catch {
        // Handle missing combinations gracefully
      }
    }
  }

  // 4. Filter by date client-side
  const dateStr = date.toISOString().split('T')[0]
  return allShowtimes.filter(st => 
    st.startTime.startsWith(dateStr)
  )
}
```

### Form Submission Examples

**Create Single Showtime (Action #7):**
```typescript
POST /api/v1/showtimes/showtime
{
  "cinemaId": "c_001",
  "movieId": "m_123",
  "hallId": "h_001",
  "startTime": "2025-12-20T14:00:00Z",
  "endTime": "2025-12-20T16:20:00Z",
  "format": "2D",
  "language": "VIETNAMESE",
  "subtitles": ["ENGLISH"],
  "price": 200000
}
```

**Update Showtime (Action #9):**
```typescript
PATCH /api/v1/showtimes/showtime/st_001
{
  "startTime": "2025-12-20T15:00:00Z",
  "endTime": "2025-12-20T17:20:00Z",
  "price": 250000
}
```

### Backend Enhancement Needed (HIGH PRIORITY)
- ⚠️ **Kiểm Chứng Backend:** 
  - [apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts](apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts) - Có các endpoints: `POST /showtimes/showtime`, `PATCH /showtimes/showtime/:id`, `DELETE /showtimes/showtime/:id`
  - **Thiếu:** Không có `GET /api/v1/showtimes/admin?filters` - Backend chỉ có `GET /api/v1/cinemas/:cinemaId/movies/:movieId/showtimes/admin` (require cinemaId AND movieId)
  - **Workaround:** Fetch all cinemas → Fetch all movies → Create cartesian product → Filter by date client-side. Viable nhưng N×M API calls
  - **Recommendation:** Yêu cầu backend: `GET /api/v1/showtimes/admin?date=XXX&cinemaId=optional&movieId=optional&page=1&limit=20`

### Implementation Notes
- ⚠️ **Workaround is complex** - Strongly recommend requesting backend API 5.1 first
- For MVP: Can limit filters (e.g., require cinemaId OR movieId)
- Currently using mock data with hardcoded filters
- Batch create button links to separate page (batch-showtimes)

---

## 🎬 MOVIE RELEASES PAGE
**Route:** `/dashboard/movie-releases`

### Current Functionality
- [x] List movie releases grouped by movie
- [x] Filter by movie status (upcoming, active, ended)
- [x] Search by movie title
- [x] Create new release
- [x] Edit release
- [x] Delete release
- [x] Create showtimes from release (inline action)

### Page Layout & Action Points

```
┌─────────────────────────────────────────────────────┐
│ MOVIE RELEASES PAGE                                 │
├─────────────────────────────────────────────────────┤
│ [Search] [Status: ▼ All|Upcoming|Active|Ended]     │
│ [+ ADD NEW RELEASE]                                 │
├─────────────────────────────────────────────────────┤
│ Movies with Releases                                │
│ ┌─ Avatar 3                    [Status: UPCOMING]   │
│ │  Poster | Release Cards                           │
│ │  ┌──────────────────────────┐                     │
│ │  │ Dec 20 → Feb 28, 2026   │                     │
│ │  │ Winter release event     │                     │
│ │  │ [Edit] [Delete] [⏱️ Create Showtimes]         │
│ │  └──────────────────────────┘                     │
│ │                                                   │
│ └─ Oppenheimer                [Status: ACTIVE]     │
│    └─ Release cards...                              │
└─────────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load all movies + their releases | (1) `GET /api/v1/movies` (2) For each: `GET /api/v1/movies/:id/releases` | 1.1 + 6.1 | ✅ Ready | Fetch releases per movie |
| **2** | **Search Box** | Filter by movie title | Local filter | - | - | Filter from loaded data |
| **3** | **Status Filter** | Filter by release status (UPCOMING/ACTIVE/ENDED) | Local filter | - | - | Filter from loaded data |
| **4** | **[+ ADD NEW RELEASE]** | Open create dialog with movie dropdown | `GET /api/v1/movies` (already loaded) | 1.1 | ✅ Ready | - |
| **5** | **Create Dialog → [Save]** | Create new release | `POST /api/v1/movie-releases` | 6.2 | ✅ Ready | See form example |
| **6** | **Release Card [Edit]** | Open edit dialog pre-filled | No API call | - | - | Use card data |
| **7** | **Edit Dialog → [Save]** | Update release | `PUT /api/v1/movie-releases/:id` | 6.3 | ✅ Ready | - |
| **8** | **Release Card [Delete]** | Open delete confirmation | No API call | - | - | - |
| **9** | **Delete Dialog → [Confirm]** | Delete release | `DELETE /api/v1/movie-releases/:id` | 6.4 | ✅ Ready | - |
| **10** | **Release Card [⏱️ Create Showtimes]** | Navigate to batch-showtimes page | Query param: `?movieId=xxx&releaseId=xxx` | - | - | Router push with pre-selected release |

### Form Submission Examples

**Create Release (Action #5):**
```typescript
POST /api/v1/movie-releases
{
  "movieId": "m_123",
  "startDate": "2025-12-20",
  "endDate": "2026-02-28",
  "status": "UPCOMING",
  "note": "Winter release event - Extended run"
}
```

**Update Release (Action #7):**
```typescript
PUT /api/v1/movie-releases/r_456
{
  "startDate": "2025-12-25",
  "endDate": "2026-03-10",
  "note": "Extended winter release"
}
```

### Data Fetching Pattern

```typescript
const fetchMoviesWithReleases = async () => {
  // 1. Get all movies
  const movies = await fetch('/api/v1/movies')

  // 2. For each movie, get its releases
  const moviesWithReleases = await Promise.all(
    movies.map(async (movie) => ({
      ...movie,
      releases: await fetch(`/api/v1/movies/${movie.id}/releases`)
    }))
  )

  // 3. Display grouped by movie
  return moviesWithReleases.filter(m => m.releases.length > 0)
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:** 
  - [apps/api-gateway/src/app/module/movie/controller/movie-release.controller.ts](apps/api-gateway/src/app/module/movie/controller/movie-release.controller.ts) - Có endpoints: `GET /api/v1/movies/:id/releases`, `POST /api/v1/movie-releases`, `PUT /api/v1/movie-releases/:id`, `DELETE /api/v1/movie-releases/:id`
- Release status auto-calculated based on date range (or use explicit status field)
- "Create Showtimes" action links to batch-showtimes page with pre-selected movie & release
- Currently using mock data, replace with real API

---

## 📦 BATCH SHOWTIMES PAGE
**Route:** `/dashboard/batch-showtimes`

### Current Functionality
- [x] Pre-select movie from release (if coming from movie-releases)
- [x] Select cinema & hall
- [x] Set date range
- [x] Configure repeat pattern (daily/weekly/custom)
- [x] Select time slots
- [x] Configure format & language & subtitles
- [x] Batch create showtimes
- [x] View creation history

### Page Layout & Action Points

```
┌────────────────────────────────────────────────────┐
│ BATCH SHOWTIMES PAGE                               │
├────────────────────────────────────────────────────┤
│ ┌─ STEP 1: SELECT MOVIE & RELEASE               │ │
│ │ Movie: [Avatar 3 ▼]    Release: [Dec 20-Feb 28] │ │
│ ├────────────────────────────────────────────────┤ │
│ │ ┌─ STEP 2: SELECT LOCATION                    │ │
│ │ │ Cinema: [CGV Vincom ▼]  Hall: [Hall A ▼]   │ │
│ ├────────────────────────────────────────────────┤ │
│ │ ┌─ STEP 3: DATE RANGE & REPEAT                │ │
│ │ │ From: [Dec 20] To: [Feb 28]                │ │
│ │ │ Pattern: [Daily ▼] [Specific Weekdays ▼]   │ │
│ │ ├────────────────────────────────────────────┤ │
│ │ │ ☑ Monday ☑ Tuesday ☑ Wednesday ...         │ │
│ ├────────────────────────────────────────────────┤ │
│ │ ┌─ STEP 4: TIME SLOTS                         │ │
│ │ │ ☑ 10:00 ☑ 13:30 ☑ 16:00 ☑ 19:00 ☑ 22:00 │ │
│ ├────────────────────────────────────────────────┤ │
│ │ ┌─ STEP 5: FORMAT & LANGUAGE                  │ │
│ │ │ Format: [2D ▼]  Language: [VIETNAMESE ▼]  │ │
│ │ │ Subtitles: ☑ English ☑ Chinese             │ │
│ ├────────────────────────────────────────────────┤ │
│ │ [Preview: 48 showtimes will be created]      │ │
│ │ [Create] [Clear]                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                   │
│ CREATION HISTORY (Last 5 batches)               │
│ [Show History ▼]                                │
└────────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load movies dropdown | `GET /api/v1/movies` | 1.1 | ✅ Ready | Pre-populate if movieId in URL |
| **2** | **Movie Select** | Load releases for selected movie | `GET /api/v1/movies/:movieId/releases` | 6.1 | ✅ Ready | Filter releases by movie |
| **3** | **Cinema Dropdown** | Load all cinemas | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | - |
| **4** | **Hall Dropdown** | Load halls for selected cinema | `GET /api/v1/halls/cinema/:cinemaId` | 5.2 | ✅ Ready | Triggered on cinema select |
| **5** | **Preview Button** | Calculate how many showtimes will be created | No API (local calculation) | - | - | Based on: dates × time slots |
| **6** | **[Create] Button** | Batch create showtimes | `POST /api/v1/showtimes/batch` | 5.4 | ✅ Ready | See form example |
| **7** | **[Show History ▼]** | Expand creation history section | No API (use cached data) | - | - | Current page already has mock history |

### Form Submission Example (Action #6)

**Batch Create Showtimes:**
```typescript
POST /api/v1/showtimes/batch
{
  "movieId": "m_123",
  "movieReleaseId": "r_456",
  "cinemaId": "c_001",
  "hallId": "h_001",
  "startDate": "2025-12-20",
  "endDate": "2026-02-28",
  "timeSlots": ["10:00", "13:30", "16:00", "19:00", "22:00"],
  "repeatType": "CUSTOM_WEEKDAYS",
  "weekdays": [1, 2, 3, 4, 5],  // Monday-Friday
  "format": "2D",
  "language": "VIETNAMESE",
  "subtitles": ["ENGLISH"]
}
```

### Response Example (from API 5.4)

```typescript
{
  "createdCount": 48,
  "skippedCount": 2,
  "created": [
    {
      "id": "st_001",
      "startTime": "2025-12-20T10:00:00Z",
      "movieTitle": "Avatar 3",
      "hallName": "Hall A"
    },
    {
      "id": "st_002",
      "startTime": "2025-12-20T13:30:00Z",
      "movieTitle": "Avatar 3",
      "hallName": "Hall A"
    }
    // ... more created
  ],
  "skipped": [
    {
      "start": "2025-12-25T10:00:00Z",  // Christmas might have conflict
      "reason": "TIME_CONFLICT"
    }
    // ... more skipped
  ]
}
```

### Cascading Dropdown Logic

```typescript
// On movie change: Load releases
const onMovieChange = (movieId) => {
  const releases = await fetch(`/api/v1/movies/${movieId}/releases`)
  setReleases(releases)
  setSelectedRelease(releases[0])  // Auto-select first
}

// On cinema change: Load halls
const onCinemaChange = (cinemaId) => {
  const halls = await fetch(`/api/v1/halls/cinema/${cinemaId}`)
  setHalls(halls)
  setSelectedHall(halls[0])  // Auto-select first
}

// Calculate preview
const calculatePreview = () => {
  const dateCount = getDaysBetween(startDate, endDate)
    .filter(d => weekdays.includes(d.getDay())).length
  const timeSlotCount = selectedTimeSlots.length
  return dateCount * timeSlotCount  // e.g., 25 days × 5 slots = 125 showtimes
}
```

### Pre-population from URL (if coming from movie-releases page)

```typescript
// URL: /batch-showtimes?movieId=m_123&releaseId=r_456
const searchParams = useSearchParams()
const preSelectedMovieId = searchParams.get('movieId')
const preSelectedReleaseId = searchParams.get('releaseId')

useEffect(() => {
  if (preSelectedMovieId) {
    setSelectedMovie(preSelectedMovieId)
    // Load releases and pre-select
    const releases = await fetch(`/api/v1/movies/${preSelectedMovieId}/releases`)
    if (preSelectedReleaseId) {
      setSelectedRelease(
        releases.find(r => r.id === preSelectedReleaseId)
      )
    }
  }
}, [preSelectedMovieId, preSelectedReleaseId])
```

### Implementation Notes
- ✅ **Mostly Ready** - Needs workaround for flexible showtime filtering (same as Showtimes page)
- ✅ **Kiểm Chứng Backend:**
  - [apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts](apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts) - Có `POST /api/v1/showtimes/batch`, `GET /api/v1/showtimes/:id/seats`
  - ⚠️ **Thiếu:** Flexible showtime filtering (same issue as Showtimes page)
- Complex form with cascading dropdowns - use proper state management
- Preview calculation helps user understand batch size before submitting
- History shows past batch operations (can be stored in localStorage or fetched from backend)
- Currently uses mock data and hardcoded history

---

## 💺 SHOWTIME SEATS PAGE
**Route:** `/dashboard/showtime-seats`

### Current Functionality
- [x] Select cinema/date/movie/showtime
- [x] Display seat map with status
- [x] Show seat details (type, reservation status)
- [x] Show booking info (who reserved)
- [x] View-only (no modifications)

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ SHOWTIME SEATS PAGE (Read-Only)                  │
├──────────────────────────────────────────────────┤
│ Filters:                                         │
│ Cinema: [CGV Vincom ▼]                          │
│ Movie: [Avatar 3 ▼]                             │
│ Date: [Dec 20, 2025 ▼]                          │
│ Showtime: [14:00 (2D) ▼] [Price: 200,000 VND]  │
├──────────────────────────────────────────────────┤
│                    HALL A (120 seats)            │
│          Screen                                  │
│  ┌─────────────────────────────┐               │
│  │ A [🟢][🟢][🔴][🟢][🟢]...  │               │
│  │ B [🟢][🟡][🟡][🟢][🟢]...  │               │
│  │ C [🔴][🔴][🟢][🟢][🟢]...  │               │
│  └─────────────────────────────┘               │
│ 🟢=AVAILABLE  🔴=HELD  🟡=CONFIRMED  ⚫=BROKEN   │
│                                                  │
│ Seat Details (on click):                        │
│ ├─ Seat: A1 | Type: STANDARD                    │
│ ├─ Status: AVAILABLE | Price: 200,000 VND      │
│ └─ Reserved by: N/A                            │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load all cinemas | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | For cinema dropdown |
| **2** | **Cinema Dropdown** | Load movies for cinema | `GET /api/v1/movies` | 1.1 | ✅ Ready | Filter client-side or use param |
| **3** | **Movie Dropdown** | Load showtimes for movie-date | **Workaround:** See Showtimes page | 5.1 | ⚠️ Workaround | Same issue: need flexible API |
| **4** | **Showtime Dropdown** | Load seat map for selected showtime | `GET /api/v1/showtimes/:id/seats` | 5.7 | ✅ Ready | Main data display |
| **5** | **Seat Click (optional)** | Show seat detail modal | No API (data already loaded) | - | - | Use seat data from 5.7 |

### Workaround for Showtime Filtering (Action #3)

Same as Showtimes page - see Showtimes page "Workaround Implementation Pattern" section.

### Response Format Expected (from API 5.7)

```typescript
interface ShowtimeSeat {
  id: string;
  seatNumber: string;          // "A1", "A2", etc
  row: string;                 // "A", "B", "C"
  seatType: 'STANDARD' | 'VIP' | 'COUPLE' | 'PREMIUM' | 'WHEELCHAIR';
  seatStatus: 'ACTIVE' | 'BROKEN' | 'MAINTENANCE';  // Seat physical status
  reservationStatus: 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'CANCELLED';
  reservedBy?: {
    userId: string;
    userName: string;
    email: string;
  };
  reservedAt?: string;         // ISO timestamp
  expiresAt?: string;          // Hold expiration time
}

interface ShowtimeSeatsResponse {
  id: string;                  // showtime ID
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  startTime: string;
  endTime: string;
  format: string;              // "2D", "IMAX", etc
  language: string;
  subtitles: string[];
  price: number;
  totalSeats: number;
  totalAvailable: number;
  totalHeld: number;
  totalConfirmed: number;
  totalBroken: number;
  totalMaintenances: number;
  seats: ShowtimeSeat[];
}
```

### Seat Map Visualization Logic

```typescript
// Group seats by row
const seatsByRow = seats.reduce((acc, seat) => {
  if (!acc[seat.row]) acc[seat.row] = []
  acc[seat.row].push(seat)
  return acc
}, {})

// Render rows
Object.entries(seatsByRow).map(([row, rowSeats]) => (
  <div key={row} className="flex gap-1">
    <span className="w-8">{row}</span>
    {rowSeats.map(seat => (
      <button
        key={seat.id}
        onClick={() => showSeatDetail(seat)}
        className={getSeatColor(seat.seatStatus, seat.reservationStatus)}
      >
        {seat.seatNumber}
      </button>
    ))}
  </div>
))

function getSeatColor(seatStatus, reservationStatus) {
  if (seatStatus === 'BROKEN') return 'bg-gray-400'        // ⚫
  if (seatStatus === 'MAINTENANCE') return 'bg-orange-400' // 🟠
  
  if (reservationStatus === 'AVAILABLE') return 'bg-green-400'   // 🟢
  if (reservationStatus === 'HELD') return 'bg-red-400'          // 🔴
  if (reservationStatus === 'CONFIRMED') return 'bg-yellow-400'  // 🟡
  if (reservationStatus === 'CANCELLED') return 'bg-gray-300'    // ⚪
  
  return 'bg-gray-300'
}
```

### Implementation Notes
- ⚠️ **Workaround needed for flexible showtime filtering** (same as Showtimes page)
- ✅ **Kiểm Chứng Backend:** 
  - [apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts](apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts) - Có `GET /api/v1/showtimes/:id/seats` với seat layout và prices
  - ⚠️ **Same issue as Showtimes page:** Cần workaround để filter showtimes
- This page is **read-only** - for viewing/monitoring only
- **Seat status modifications** should be done from Seat-Status page (using API 4.6)
- Currently uses mock data with hardcoded seat map

---

## 💰 TICKET PRICING PAGE
**Route:** `/dashboard/ticket-pricing`

### Current Functionality
- [x] Select cinema & hall from dropdowns
- [x] Display pricing table (seat type × day type)
- [x] Edit prices inline
- [x] Save price changes
- [x] Auto-suggest pricing

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ TICKET PRICING PAGE                              │
├──────────────────────────────────────────────────┤
│ Cinema: [CGV Vincom ▼] Hall: [Hall A ▼]         │
│ [Apply to All Halls] [Suggest Prices]            │
├──────────────────────────────────────────────────┤
│ Pricing Matrix (Hall A, 2D)                      │
│ ┌──────────┬──────────┬──────────┬──────────┐   │
│ │ Seat Type│ Weekday  │ Weekend  │ Holiday  │   │
│ ├──────────┼──────────┼──────────┼──────────┤   │
│ │ Standard │ 200,000₫ │ 250,000₫ │ 300,000₫│   │
│ │ VIP      │ 280,000₫ │ 350,000₫ │ 400,000₫│   │
│ │ Couple   │ 450,000₫ │ 550,000₫ │ 650,000₫│   │
│ │ Premium  │ 350,000₫ │ 420,000₫ │ 500,000₫│   │
│ │ Wheelchair│ 150,000₫ │ 150,000₫ │ 150,000₫│   │
│ └──────────┴──────────┴──────────┴──────────┘   │
│ [Clear] [Save]                                   │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load all cinemas | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | For cinema dropdown |
| **2** | **Cinema Dropdown** | Load halls for cinema | `GET /api/v1/halls/cinema/:cinemaId` | 5.2 | ✅ Ready | Triggered on cinema select |
| **3** | **Hall Dropdown** | Load pricing for selected hall | `GET /api/v1/ticket-pricings/hall/:hallId` | 7.1 | ✅ Ready | Main data display |
| **4** | **Price Cell Edit** | Start inline editing | No API (local state) | - | - | Use React state for form |
| **5** | **[Save] Button** | Update individual price | `PATCH /api/v1/ticket-pricings/pricing/:pricingId` | 7.2 | ✅ Ready | Update each modified price |
| **6** | **[Apply to All Halls]** | Copy pricing to other halls (optional) | Loop: `PATCH /api/v1/ticket-pricings/pricing/:pricingId` | 7.2 | ✅ Ready | Bulk update across halls |
| **7** | **[Suggest Prices]** | Auto-generate pricing (optional) | No API (client-side logic) | - | - | Generate based on seat type rules |

### Form Submission Examples

**Update Single Price (Action #5):**
```typescript
PATCH /api/v1/ticket-pricings/pricing/tp_001
{
  "price": 250000
}
```

**Response from GET /api/v1/ticket-pricings/hall/:hallId (Action #3):**
```typescript
[
  {
    "id": "tp_001",
    "hallId": "h_001",
    "seatType": "STANDARD",
    "dayType": "WEEKDAY",
    "price": 200000,
    "currency": "VND",
    "effectiveFrom": "2025-01-01"
  },
  {
    "id": "tp_002",
    "hallId": "h_001",
    "seatType": "STANDARD",
    "dayType": "WEEKEND",
    "price": 250000,
    "currency": "VND"
  },
  // ... more pricing entries for other seat types and day types
  // Expected: 5 seat types × 3 day types = 15 entries minimum
]
```

### Pricing Table Structure

```typescript
const SEAT_TYPES = ['STANDARD', 'VIP', 'COUPLE', 'PREMIUM', 'WHEELCHAIR']
const DAY_TYPES = ['WEEKDAY', 'WEEKEND', 'HOLIDAY']

// Organize fetched data into table format
const pricingMatrix = {}
prices.forEach(price => {
  if (!pricingMatrix[price.seatType]) {
    pricingMatrix[price.seatType] = {}
  }
  pricingMatrix[price.seatType][price.dayType] = price
})

// Render table
<table>
  <thead>
    <tr>
      <th>Seat Type</th>
      {DAY_TYPES.map(day => <th key={day}>{day}</th>)}
    </tr>
  </thead>
  <tbody>
    {SEAT_TYPES.map(seatType => (
      <tr key={seatType}>
        <td>{seatType}</td>
        {DAY_TYPES.map(dayType => (
          <td key={`${seatType}-${dayType}`}>
            <EditablePrice
              id={pricingMatrix[seatType][dayType].id}
              value={pricingMatrix[seatType][dayType].price}
              onSave={(newPrice) => updatePrice(...)}
            />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

### Bulk Update Pattern (Action #6 - Optional)

```typescript
async function applyToAllHalls(currentHallId, prices) {
  // 1. Get current cinema
  const cinema = cinemas.find(c => 
    c.halls?.some(h => h.id === currentHallId)
  )
  
  // 2. Get all halls in cinema
  const halls = await fetch(`/api/v1/halls/cinema/${cinema.id}`)
  
  // 3. For each other hall, update pricing
  for (const hall of halls) {
    if (hall.id === currentHallId) continue
    
    // Get existing pricing for this hall
    const hallPrices = await fetch(`/api/v1/ticket-pricings/hall/${hall.id}`)
    
    // Update each price to match current hall
    for (const price of prices) {
      const existingPrice = hallPrices.find(p => 
        p.seatType === price.seatType && 
        p.dayType === price.dayType
      )
      
      if (existingPrice) {
        await fetch(`/api/v1/ticket-pricings/pricing/${existingPrice.id}`, {
          method: 'PATCH',
          body: { price: price.price }
        })
      }
    }
  }
  
  toast.success(`Pricing applied to ${halls.length - 1} halls`)
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:**
  - [apps/api-gateway/src/app/module/cinema/controller/ticket-pricing.controller.ts](apps/api-gateway/src/app/module/cinema/controller/ticket-pricing.controller.ts) - Có `GET /api/v1/ticket-pricings/hall/:hallId` và `PATCH /api/v1/ticket-pricings/pricing/:pricingId`
- Inline editing: Use local state for form, save on blur or with [Save] button
- Consider showing effective dates if pricing varies by date range
- Currently uses mock data with hardcoded cinema/hall data

---

## 🪑 SEAT STATUS PAGE
**Route:** `/dashboard/seat-status`

### Current Functionality
- [x] Select cinema & hall from dropdowns
- [x] Display seat map with status indicators
- [x] Filter seats by status (active, broken, maintenance)
- [x] Click seat to change status
- [x] Bulk status updates
- [x] Maintenance mode toggle

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ SEAT STATUS PAGE                                 │
├──────────────────────────────────────────────────┤
│ Cinema: [CGV Vincom ▼] Hall: [Hall A ▼]         │
│ Filter: [All] [ACTIVE] [BROKEN] [MAINTENANCE]   │
│ [Bulk Mark as] [Maintenance Mode ⚠️]            │
├──────────────────────────────────────────────────┤
│                    HALL A (120 seats)            │
│          Screen                                  │
│  ┌─────────────────────────────┐               │
│  │ A [🟢][🟢][🔴][🟢][🟢]...  │ ← Row A     │
│  │ B [🟢][🟡][🟡][🟢][🟢]...  │ ← Row B     │
│  │ C [🔴][🔴][🟢][🟢][🟢]...  │ ← Row C     │
│  └─────────────────────────────┘               │
│ 🟢=ACTIVE  🔴=BROKEN  🟡=MAINTENANCE            │
│                                                  │
│ Legend: 120 total | 110 ACTIVE | 8 BROKEN | 2 MAINT
│                                                  │
│ Seat Info (on click):                           │
│ ├─ Seat: C1 | Row: C | Number: 1                │
│ ├─ Type: STANDARD | Current: BROKEN             │
│ └─ Change to: [ACTIVE] [BROKEN] [MAINTENANCE]  │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load all cinemas | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | For cinema dropdown |
| **2** | **Cinema Dropdown** | Load halls for cinema | `GET /api/v1/halls/cinema/:cinemaId` | 5.2 | ✅ Ready | Triggered on cinema select |
| **3** | **Hall Dropdown** | Load full seat map | `GET /api/v1/halls/hall/:hallId` | 4.2 | ✅ Ready | Main data display |
| **4** | **Seat Click** | Open status change dialog | No API (use loaded data) | - | - | Show current status in dialog |
| **5** | **Status Dialog → Select New Status** | Change seat status | `PATCH /api/v1/halls/seat/:seatId/status` | 4.6 | ✅ Ready | Update single seat status |
| **6** | **[Bulk Mark as ▼] Button** | Open bulk update dialog | No API (local selection) | - | - | Select multiple seats first |
| **7** | **Bulk Dialog → [Apply] Button** | Update multiple seats | Loop: `PATCH /api/v1/halls/seat/:seatId/status` | 4.6 | ✅ Ready | Batch update selected seats |
| **8** | **Filter Buttons** | Filter seat display | Local filter (in-memory) | - | - | Filter already-loaded seats |
| **9** | **Status Indicators** | Show color-coded seat statuses | No API (display logic) | - | - | Show legend |
| **10** | **Statistics Summary** | Show seat count by status | Local calculation | - | - | Count loaded seats by status |

### Form Submission Examples

**Update Single Seat Status (Action #5):**
```typescript
PATCH /api/v1/halls/seat/s_001/status
{
  "status": "BROKEN"  // "ACTIVE", "BROKEN", or "MAINTENANCE"
}
```

**Bulk Update Seats (Action #7):**
```typescript
// Call PATCH for each selected seat
const selectedSeats = ['s_001', 's_002', 's_003']  // User selected these
const newStatus = 'MAINTENANCE'

for (const seatId of selectedSeats) {
  await fetch(`/api/v1/halls/seat/${seatId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  })
}
```

### Response Format Expected (from API 4.2)

```typescript
interface HallWithSeats {
  id: string;
  cinemaId: string;
  name: string;
  type: string;          // "2D", "IMAX", etc
  capacity: number;
  rows: number;
  cols: number;
  seats: {
    id: string;
    row: string;         // "A", "B", "C"
    seatNumber: string;  // "1", "2", "3"
    type: 'STANDARD' | 'VIP' | 'COUPLE' | 'PREMIUM' | 'WHEELCHAIR';
    status: 'ACTIVE' | 'BROKEN' | 'MAINTENANCE';  // Current status
  }[]
}
```

### Seat Map Visualization & Logic

```typescript
// Group seats by row for display
const seatsByRow = seats.reduce((acc, seat) => {
  if (!acc[seat.row]) acc[seat.row] = []
  acc[seat.row].push(seat)
  return acc
}, {})

// Apply filter
const filteredSeats = Object.entries(seatsByRow).reduce((acc, [row, seats]) => {
  const filtered = seats.filter(s => !selectedFilter || s.status === selectedFilter)
  if (filtered.length > 0) {
    acc[row] = filtered
  }
  return acc
}, {})

// Render seat map
Object.entries(filteredSeats).map(([row, rowSeats]) => (
  <div key={row} className="flex gap-1">
    <span className="w-8 font-bold">{row}</span>
    {rowSeats.map(seat => (
      <button
        key={seat.id}
        onClick={() => openStatusDialog(seat)}
        className={`w-8 h-8 text-xs rounded ${getStatusColor(seat.status)}`}
        title={`${row}${seat.seatNumber}: ${seat.type} - ${seat.status}`}
      >
        {seat.seatNumber}
      </button>
    ))}
  </div>
))

function getStatusColor(status) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-400 text-white'           // 🟢
    case 'BROKEN':
      return 'bg-red-400 text-white'             // 🔴
    case 'MAINTENANCE':
      return 'bg-yellow-400 text-black'          // 🟡
    default:
      return 'bg-gray-300 text-gray-600'
  }
}

// Calculate statistics
const stats = {
  total: seats.length,
  active: seats.filter(s => s.status === 'ACTIVE').length,
  broken: seats.filter(s => s.status === 'BROKEN').length,
  maintenance: seats.filter(s => s.status === 'MAINTENANCE').length
}
```

### Bulk Selection & Update Pattern

```typescript
// State for bulk operations
const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())
const [bulkStatus, setBulkStatus] = useState<string>('MAINTENANCE')

// Toggle seat selection
const toggleSeatSelection = (seatId) => {
  const newSelection = new Set(selectedSeats)
  if (newSelection.has(seatId)) {
    newSelection.delete(seatId)
  } else {
    newSelection.add(seatId)
  }
  setSelectedSeats(newSelection)
}

// Apply bulk status change
const applyBulkStatusChange = async () => {
  const promises = Array.from(selectedSeats).map(seatId =>
    fetch(`/api/v1/halls/seat/${seatId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: bulkStatus })
    })
  )
  
  await Promise.all(promises)
  setSelectedSeats(new Set())
  
  // Refresh seat map
  const updatedSeats = seats.map(s =>
    selectedSeats.has(s.id) ? { ...s, status: bulkStatus } : s
  )
  setSeats(updatedSeats)
  
  toast.success(`Updated ${selectedSeats.size} seats to ${bulkStatus}`)
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:**
  - [apps/api-gateway/src/app/module/cinema/controller/hall.controller.ts](apps/api-gateway/src/app/module/cinema/controller/hall.controller.ts) - Có `PATCH /api/v1/halls/seat/:seatId/status` để update trạng thái từng seat
- Color-coded visual indicators: ACTIVE (green), BROKEN (red), MAINTENANCE (yellow)
- Bulk operations recommended for marking multiple seats for maintenance
- Currently uses mock data with hardcoded seat layout

---

## 📋 RESERVATIONS PAGE
**Route:** `/dashboard/reservations`

### Current Functionality
- [x] List all reservations (admin view)
- [x] Filter by status (confirmed, pending, cancelled)
- [x] Filter by date range
- [x] Search by customer name / booking ID
- [x] View reservation details in modal
- [x] Change reservation status
- [x] Export to CSV (optional)

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ RESERVATIONS PAGE                                │
├──────────────────────────────────────────────────┤
│ [Search Booking ID/Name] [📅 Date Range ▼]     │
│ Tabs: [All] [Confirmed] [Pending] [Cancelled]  │
├──────────────────────────────────────────────────┤
│ Reservations Table                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Booking ID │ Customer │ Movie │ Seats │ ... │ │
│ ├─────────────────────────────────────────────┤ │
│ │ BK#12345   │ John Doe │ Avatar3 │ A1,A2│ ✓ │ │
│ │ [View Details] [Change Status]              │ │
│ │ BK#12346   │ Jane Smith │ Oppenheimer │... │ │
│ │ [View Details] [Change Status]              │ │
│ └─────────────────────────────────────────────┘ │
│ [Export CSV]                                     │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load (Default: last 30 days, CONFIRMED)** | Load reservations | `GET /api/v1/bookings/admin/all?status=CONFIRMED&startDate=30-days-ago` | 9.1 | ✅ Ready | Load default view |
| **2** | **Tab Click (All/Confirmed/Pending/Cancelled)** | Filter by status | `GET /api/v1/bookings/admin/all?status=CONFIRMED` | 9.1 | ✅ Ready | Fetch for selected status |
| **3** | **Date Range Picker** | Set custom date range | `GET /api/v1/bookings/admin/all?startDate=XXX&endDate=XXX` | 9.1 | ✅ Ready | Fetch for date range |
| **4** | **Search Box** | Search by ID or customer name | Local filter from loaded data | - | - | Filter in-memory results |
| **5** | **Row [View Details]** | Open reservation detail modal | `GET /api/v1/bookings/:id/summary` | 9.2 | ✅ Ready | Detailed booking info |
| **6** | **Detail Modal [Change Status]** | Open status change dropdown | No API (local dialog) | - | - | Show status options |
| **7** | **Status Dropdown → [Confirm]** | Update reservation status | `PUT /api/v1/bookings/admin/:id/status` | 9.3 | ✅ Ready | Change status |
| **8** | **[Export CSV] Button** | Export visible reservations | No API (frontend CSV generation) | - | - | Use loaded data |
| **9** | **Pagination** | Load next/previous page | `GET /api/v1/bookings/admin/all?page=N&limit=20` | 9.1 | ✅ Ready | If API supports pagination |

### Form Submission Examples

**Change Status (Action #7):**
```typescript
PUT /api/v1/bookings/admin/bk_12345/status
{
  "status": "CANCELLED"  // "CONFIRMED", "PENDING", "CANCELLED", etc
}
```

**Response Format Expected (from API 9.2):**
```typescript
interface ReservationDetail {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  movieId: string;
  movieTitle: string;
  movieRating: number;
  
  cinemaId: string;
  cinemaName: string;
  
  hallId: string;
  hallName: string;
  
  showtimeId: string;
  showtimeDate: string;
  showtimeStartTime: string;
  showtimeEndTime: string;
  showtimeFormat: string;
  showtimeLanguage: string;
  
  seats: {
    id: string;
    seatNumber: string;
    type: string;
  }[];
  
  totalPrice: number;
  currency: string;
  
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: 'CARD' | 'CASH' | 'WALLET';
}
```

### API Call Patterns

**Load Initial List (Action #1):**
```typescript
const today = new Date()
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

const reservations = await fetch(
  `/api/v1/bookings/admin/all?status=CONFIRMED&startDate=${thirtyDaysAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}&page=1&limit=20`
)
```

**Change Filters (Actions #2-3):**
```typescript
async function fetchReservations(filters) {
  const params = new URLSearchParams()
  
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status)
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate)
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate)
  }
  if (filters.page) {
    params.append('page', filters.page)
  }
  
  const url = `/api/v1/bookings/admin/all?${params.toString()}`
  return fetch(url)
}
```

### Implementation Notes
- ✅ **ALL APIs are ready** - No backend changes needed
- ✅ **Kiểm Chứng Backend:**
  - [apps/api-gateway/src/app/module/booking/controller/booking.controller.ts](apps/api-gateway/src/app/module/booking/controller/booking.controller.ts) - Có tất cả admin endpoints: `GET /api/v1/bookings/admin/all`, `GET /api/v1/bookings/:id/summary`, `PUT /api/v1/bookings/admin/:id/status`
  - Response format: Bookings có status, payment info, customer details, seat info
- Default view: CONFIRMED reservations from last 30 days
- Tabs for quick status filtering
- Search & date range for advanced filtering
- CSV export uses client-side generation from loaded data
- Currently uses mock data with hardcoded reservations

---

## 👥 STAFF PAGE
**Route:** `/dashboard/staff`

### Current Functionality
- [x] List all staff members
- [x] Filter by role (admin, manager, staff)
- [x] Filter by status (active, inactive)
- [x] Search by name
- [x] Create new staff member
- [x] Edit staff info
- [x] Delete/Deactivate staff
- [x] Assign cinema to staff

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ STAFF PAGE                                       │
├──────────────────────────────────────────────────┤
│ [Search Name] [Role: ▼] [Status: ▼]             │
│ [+ ADD NEW STAFF]                                │
├──────────────────────────────────────────────────┤
│ Staff Table                                      │
│ ┌──────────────────────────────────────────────┐ │
│ │ Name │ Role │ Cinema │ Email │ Status │ ... │ │
│ ├──────────────────────────────────────────────┤ │
│ │ John │ MANAGER │ CGV Vincom │ j@... │ ✓ │ │
│ │ [Edit] [Delete] [⋮]                         │ │
│ │ Jane │ STAFF │ Lotte Cinema │ j@... │ ✓ │ │
│ │ [Edit] [Delete] [⋮]                         │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Load all staff with filters | `GET /api/v1/staff?role=MANAGER&status=ACTIVE` | 8.1 | ❌ Missing | **Workaround:** Use `GET /api/v1/users` + client-side filter |
| **2** | **Role Filter** | Filter staff by role | Query param or local filter | 8.1 | ❌ Missing | - |
| **3** | **Status Filter** | Filter staff by status | Query param or local filter | 8.1 | ❌ Missing | - |
| **4** | **[+ ADD NEW STAFF]** | Open create dialog with cinema dropdown | `GET /api/v1/cinemas/filters` | 3.1 | ✅ Ready | For cinema assignment |
| **5** | **Create Dialog → [Save]** | Create new staff | `POST /api/v1/staff` | 8.2 | ❌ Missing | Needs backend implementation |
| **6** | **Staff Row [Edit]** | Open edit dialog pre-filled | No API (use loaded data) | - | - | - |
| **7** | **Edit Dialog → [Save]** | Update staff | `PATCH /api/v1/staff/:id` | 8.3 | ❌ Missing | Needs backend implementation |
| **8** | **Staff Row [Delete]** | Open delete confirmation | No API | - | - | - |
| **9** | **Delete Dialog → [Confirm]** | Delete/Deactivate staff | `DELETE /api/v1/staff/:id` | 8.4 | ❌ Missing | Needs backend implementation |

### ⚠️ Workaround for Get Staff List (Action #1)

```typescript
// Until backend implements ID 8.1
async function getStaff(filters) {
  // Option A: Use Clerk API if integrated
  const clerkUsers = await fetch('/api/v1/users')
  
  // Option B: Manually filter staff from all users
  const staffUsers = clerkUsers.filter(user => {
    const hasStaffRole = user.role === 'MANAGER' || 
                         user.role === 'STAFF' || 
                         user.role === 'ADMIN'
    if (!hasStaffRole) return false
    
    if (filters?.role && user.role !== filters.role) return false
    if (filters?.status && user.status !== filters.status) return false
    if (filters?.search && !user.name.toLowerCase().includes(filters.search)) return false
    
    return true
  })
  
  return staffUsers
}
```

### ❌ Backend Implementation Needed (HIGH PRIORITY - VERIFIED MISSING)

**✅ Kiểm Chứng Thực Tế:** 
- ❌ Không có endpoint `GET /api/v1/staff` trong backend
- ❌ [apps/api-gateway/src/app/module/user/controller/user.controller.ts](apps/api-gateway/src/app/module/user/controller/user.controller.ts) chỉ có `GET /api/v1/users` - trả về tất cả Clerk users mà không phân biệt role/status
- ❌ Không có PATCH, DELETE staff endpoints
- **Phần này hoàn toàn block - cần thêm Staff module vào backend**

**ID 8.1 - Get Staff List:**
```typescript
GET /api/v1/staff?role=MANAGER&status=ACTIVE&cinemaId=xxx&page=1&limit=20

Response:
[
  {
    "id": "u_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+84912345678",
    "role": "MANAGER",
    "cinemaId": "c_001",
    "cinemaName": "CGV Vincom",
    "status": "ACTIVE",
    "hireDate": "2024-01-15",
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

**ID 8.2 - Create Staff:**
```typescript
POST /api/v1/staff

Request:
{
  "email": "newstaff@example.com",
  "name": "Jane Smith",
  "phone": "+84912345678",
  "role": "STAFF",  // ADMIN, MANAGER, STAFF
  "cinemaId": "c_001",
  "hireDate": "2025-12-17"
}

Response:
{
  "id": "u_456",
  "email": "newstaff@example.com",
  "name": "Jane Smith",
  "role": "STAFF",
  "status": "ACTIVE"
}
```

**ID 8.3 - Update Staff:**
```typescript
PATCH /api/v1/staff/u_456

Request:
{
  "name": "Jane Smith Updated",
  "phone": "+84912345679",
  "role": "MANAGER",
  "cinemaId": "c_002"
}
```

**ID 8.4 - Delete Staff:**
```typescript
DELETE /api/v1/staff/u_456

// Soft delete: Set status to INACTIVE
// Or hard delete: Remove from database + Clerk
```

### Implementation Notes
- ❌ **ALL 4 STAFF APIs are missing** - Cannot implement this page until backend adds complete Staff module
- ❌ **Kiểm Chứng:** Backend không có bất kỳ staff management endpoints nào - chỉ có generic `GET /users` từ Clerk
- Recommend adding `staff_profiles` table for cinema assignment and staff-specific metadata
- Roles: ADMIN, MANAGER, STAFF
- Status: ACTIVE, ON_LEAVE, TERMINATED
- Currently uses mock data with hardcoded staff list
- **BLOCKED:** Không thể implement trang này mà không có backend endpoints

---

## ⭐ REVIEWS PAGE
**Route:** `/dashboard/reviews`

### Current Functionality
- [x] List all movie reviews
- [x] Filter by rating (1-5 stars)
- [x] Filter by status (active, hidden, deleted)
- [x] Search by movie or reviewer name
- [x] View review details
- [x] Hide/Delete review (soft delete)
- [x] See likes/dislikes count
- [x] See verification badge

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ REVIEWS PAGE                                     │
├──────────────────────────────────────────────────┤
│ [Search Movie/Reviewer] [Rating: ▼] [Status: ▼] │
├──────────────────────────────────────────────────┤
│ Review Cards                                     │
│ ┌──────────────────────────────────────────────┐ │
│ │ Movie: Avatar 3 | Rating: ⭐⭐⭐⭐⭐ (5/5)       │ │
│ │ By: John Doe | 2025-12-15 | ✓ Verified Watcher │
│ │ "Great movie! Highly recommend..."            │ │
│ │ 👍 124 | 👎 5 | Status: ACTIVE                │ │
│ │ [View Details] [Hide] [Delete] [⋮]            │ │
│ │                                                │ │
│ └──────────────────────────────────────────────┘ │
│ Pagination: [< 1 2 3 >]                         │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load (Default: ACTIVE, last 30 days)** | Load reviews | `GET /api/v1/reviews?status=ACTIVE&page=1&limit=20` | 11.1 | ❌ Missing | Needs backend |
| **2** | **Movie Filter** | Filter reviews by movie | `GET /api/v1/reviews?movieId=xxx` | 11.1 | ❌ Missing | - |
| **3** | **Rating Filter** | Filter reviews by rating | `GET /api/v1/reviews?rating=5` | 11.1 | ❌ Missing | - |
| **4** | **Status Tabs** | Filter by review status | `GET /api/v1/reviews?status=ACTIVE` | 11.1 | ❌ Missing | - |
| **5** | **Search Box** | Search by reviewer name or movie title | Local filter or query param | 11.1 | ❌ Missing | - |
| **6** | **Review Card [View Details]** | Open review detail modal | `GET /api/v1/reviews/:id` | 11.2 | ❌ Missing | Show full review + author info |
| **7** | **Review Card [Hide]** | Hide inappropriate review | `PATCH /api/v1/reviews/:id/status` | 11.3 | ❌ Missing | Change status to HIDDEN |
| **8** | **Review Card [Delete]** | Delete review | `DELETE /api/v1/reviews/:id` | 11.4 | ❌ Missing | Soft or hard delete |
| **9** | **Pagination** | Load next/previous page | `GET /api/v1/reviews?page=N&limit=20` | 11.1 | ❌ Missing | If supported |
| **10** | **Movie Dropdown (optional)** | Load movies for filtering | `GET /api/v1/movies` | 1.1 | ✅ Ready | For movie filter |

### ❌ Backend Implementation Needed (MEDIUM PRIORITY)

**ID 11.1 - Get Reviews List:**
```typescript
GET /api/v1/reviews?status=ACTIVE&rating=5&movieId=xxx&page=1&limit=20

Response:
[
  {
    "id": "rev_123",
    "movieId": "m_123",
    "movieTitle": "Avatar 3",
    "userId": "u_456",
    "userName": "John Doe",
    "userAvatar": "https://...",
    "rating": 5,
    "content": "Great movie! Highly recommend...",
    "verifiedWatcher": true,
    "likes": 124,
    "dislikes": 5,
    "repliesCount": 3,
    "status": "ACTIVE",  // ACTIVE, HIDDEN, DELETED
    "createdAt": "2025-12-15T10:30:00Z",
    "updatedAt": "2025-12-16T14:20:00Z"
  }
]
```

**ID 11.2 - Get Review Details:**
```typescript
GET /api/v1/reviews/rev_123

Response:
{
  ...review from 11.1,
  "replies": [
    {
      "id": "reply_1",
      "userId": "u_admin",
      "userName": "Admin",
      "content": "Thank you for your review!",
      "createdAt": "2025-12-16T15:00:00Z"
    }
  ]
}
```

**ID 11.3 - Update Review Status:**
```typescript
PATCH /api/v1/reviews/rev_123/status

Request:
{
  "status": "HIDDEN"  // ACTIVE, HIDDEN, DELETED
}
```

**ID 11.4 - Delete Review:**
```typescript
DELETE /api/v1/reviews/rev_123
```

### Current Workaround
- Using mock reviews from `mockData.ts`
- Focus on UI/UX first with mock data
- Implement backend APIs later

### Implementation Notes
- ❌ **All 4 review APIs are missing** - Must use mock data initially
- ❌ **Kiểm Chứng:** Backend không có review module/endpoints nào
- Ratings: 1-5 stars displayed as user ratings
- Verification badge: Shows if user watched the movie
- Soft delete (status change) recommended over hard delete
- Currently uses mock data with hardcoded reviews list
- **BLOCKED:** Hoàn toàn phụ thuộc vào backend implementation

---

## 📊 REPORTS PAGE
**Route:** `/dashboard/reports`

### Current Functionality
- [x] Revenue over time (line chart)
- [x] Top movies by revenue (bar chart)
- [x] Cinema performance breakdown
- [x] Genre breakdown (pie chart)
- [x] Occupancy rate trend
- [x] Hourly distribution (peak hours)
- [x] Date range filters
- [x] Export to CSV/PDF (optional)

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ REPORTS PAGE                                     │
├──────────────────────────────────────────────────┤
│ 📅 From: [Dec 1, 2025] To: [Dec 31, 2025]       │
│ [Refresh] [Export CSV] [Export PDF]              │
├──────────────────────────────────────────────────┤
│ Tabs: [Revenue] [Movies] [Cinema] [Occupancy]   │
│                                                   │
│ REVENUE TAB                                      │
│ ┌─ Revenue Over Time (Line Chart)               │
│ │ Daily revenue trend with annotations          │
│ │                                                │
│ ├─ Revenue by Cinema (Table/Bar Chart)          │
│ │ CGV Vincom: 15,000,000₫                       │
│ │ Lotte Cinema: 12,000,000₫                     │
│ │ Galaxy Cinema: 10,500,000₫                    │
│ │                                                │
│ └─ Revenue by Movie (Top 10 Table)              │
│   Avatar 3: 25,000,000₫ | 580 tickets          │
│   Oppenheimer: 18,000,000₫ | 420 tickets       │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load (Default: Last 30 days)** | Load revenue report | `GET /api/v1/bookings/admin/revenue-report?startDate=30-days-ago&endDate=today` | 10.1 | ✅ Partial Ready | Check if `groupBy` param works |
| **2** | **Revenue Tab** | Display revenue over time | `GET /api/v1/bookings/admin/revenue-report?startDate=xxx&endDate=xxx&groupBy=day` | 10.1 | ✅ Partial Ready | Daily revenue trend |
| **3** | **Cinema Tab** | Show revenue by cinema | `GET /api/v1/reports/revenue-by-cinema?startDate=xxx&endDate=xxx` | 10.2 | ❌ Missing | Per-cinema breakdown |
| **4** | **Movies Tab** | Show revenue by movie | `GET /api/v1/reports/revenue-by-movie?startDate=xxx&endDate=xxx` | 10.3 | ❌ Missing | Top movies ranking |
| **5** | **Occupancy Tab** | Show occupancy rate trend | `GET /api/v1/reports/occupancy?startDate=xxx&endDate=xxx` | 10.4 | ❌ Missing | Seat occupancy percentage |
| **6** | **Date Range Picker** | Change date range | Re-fetch with new dates | 10.1-10.6 | ✅/❌ Mixed | Update all charts |
| **7** | **[Refresh] Button** | Refresh all data | Re-fetch all reports | 10.1-10.6 | ✅/❌ Mixed | Reload with current filters |
| **8** | **[Export CSV] Button** | Export report to CSV | Client-side generation | - | - | Use loaded data |
| **9** | **[Export PDF] Button** | Export report to PDF | Client-side generation or API | - | - | Optional: use PDF library |

### ⚠️ Workaround for Missing Report APIs (Actions #3-5)

```typescript
// Until backend implements 10.2-10.6, combine available APIs

// Revenue by Cinema (workaround)
async function getRevenueByCinema(startDate, endDate) {
  // 1. Get all cinemas
  const cinemas = await fetch('/api/v1/cinemas/filters')
  
  // 2. Get all bookings
  const bookings = await fetch(
    `/api/v1/bookings/admin/all?startDate=${startDate}&endDate=${endDate}`
  )
  
  // 3. Group by cinema client-side
  const byCinema = {}
  cinemas.forEach(c => {
    byCinema[c.id] = { cinemaName: c.name, revenue: 0, tickets: 0 }
  })
  
  bookings.forEach(b => {
    if (b.cinemaId in byCinema) {
      byCinema[b.cinemaId].revenue += b.totalPrice
      byCinema[b.cinemaId].tickets += b.seats.length
    }
  })
  
  return Object.values(byCinema).sort((a, b) => b.revenue - a.revenue)
}

// Revenue by Movie (workaround)
async function getRevenueByMovie(startDate, endDate) {
  const movies = await fetch('/api/v1/movies')
  const bookings = await fetch(
    `/api/v1/bookings/admin/all?startDate=${startDate}&endDate=${endDate}`
  )
  
  const byMovie = {}
  movies.forEach(m => {
    byMovie[m.id] = { movieTitle: m.title, revenue: 0, tickets: 0, rating: m.rating }
  })
  
  bookings.forEach(b => {
    if (b.movieId in byMovie) {
      byMovie[b.movieId].revenue += b.totalPrice
      byMovie[b.movieId].tickets += b.seats.length
    }
  })
  
  return Object.values(byMovie).sort((a, b) => b.revenue - a.revenue)
}

// Occupancy rate (workaround)
async function getOccupancyRate(startDate, endDate) {
  const bookings = await fetch(
    `/api/v1/bookings/admin/all?startDate=${startDate}&endDate=${endDate}`
  )
  
  const showtimes = await fetch(
    `/api/v1/showtimes/admin?startDate=${startDate}&endDate=${endDate}`
  )
  
  // Calculate total capacity × total confirmed seats
  const totalCapacity = showtimes.reduce((sum, st) => sum + st.hallCapacity, 0)
  const totalBooked = bookings.reduce((sum, b) => sum + b.seats.length, 0)
  
  return {
    occupancyRate: (totalBooked / totalCapacity) * 100,
    totalCapacity,
    totalBooked
  }
}
```

### ❌ Backend Implementation Status (VERIFIED)

- **ID 10.1:** ✅ PARTIAL READY - Revenue report endpoint EXISTS
  - [apps/api-gateway/src/app/module/booking/controller/booking.controller.ts](apps/api-gateway/src/app/module/booking/controller/booking.controller.ts) - Có `GET /api/v1/bookings/admin/revenue-report`
  - ✅ Hỗ trợ date range filtering (startDate, endDate)
  - ⚠️ `groupBy` parameter cần verify - implementation có nhưng có note "skip this filter for now" trong code
  
- **ID 10.2:** ❌ Revenue by cinema - NOT FOUND
- **ID 10.3:** ❌ Revenue by movie - NOT FOUND  
- **ID 10.4:** ❌ Occupancy rate - NOT FOUND
- **ID 10.5:** ❌ Ticket sales by seat type - NOT FOUND
- **ID 10.6:** ❌ Peak hours analysis - NOT FOUND

### Implementation Notes
- ✅ **ID 10.1 PARTIAL:** Revenue report endpoint EXISTS (verified), nhưng `groupBy` parameter có thể không hoạt động. Code có note "skip this filter for now"
- ❌ **IDs 10.2-10.6 ALL MISSING** - Must use workaround combining existing APIs (booking admin endpoints)
- Workarounds viable but require multiple API calls + client-side aggregation (3-4 calls per report type)
- **Recommendation:** Check with backend team if `groupBy=day` works in ID 10.1, otherwise add support
- Recommend backend implementation for better performance
- Currently uses mock data with hardcoded revenue trends

---

## ⚙️ SETTINGS PAGE
**Route:** `/dashboard/settings`

### Current Functionality
- [x] Tabs: Profile, Notifications, Security, Appearance, System
- [x] User profile settings
- [x] Email/password management
- [x] Notification preferences
- [x] Theme switching (light/dark/auto)
- [x] System configuration
- [x] Save/Cancel buttons

### Page Layout & Action Points

```
┌──────────────────────────────────────────────────┐
│ SETTINGS PAGE                                    │
├──────────────────────────────────────────────────┤
│ Tabs: [Profile] [Notifications] [Security]      │
│       [Appearance] [System]                      │
├──────────────────────────────────────────────────┤
│ PROFILE TAB                                      │
│ Full Name: [Admin User]                          │
│ Email: [admin@cinema.com]                        │
│ Avatar: [Upload]                                 │
│ Phone: [0123456789]                              │
│ Cinema: [Select Cinema]                          │
│ Role: [ADMIN]  (read-only)                       │
│ Status: [Active/Inactive]                        │
│ [Save Changes] [Cancel]                          │
│                                                   │
│ NOTIFICATIONS TAB                                │
│ ☐ Email on new reservations                      │
│ ☐ Email on cancellations                         │
│ ☐ Daily revenue summary                          │
│ ☐ Low ticket inventory alert                     │
│ ☐ Maintenance alerts                             │
│ [Save Preferences]                               │
│                                                   │
│ SECURITY TAB                                     │
│ Change Password: [Current] [New] [Confirm]       │
│ [Update Password]                                │
│ 2FA: [Enable/Disable]                            │
│ Sessions: [View Active Sessions]                 │
│                                                   │
│ APPEARANCE TAB                                   │
│ Theme: [Light / Dark / Auto]                     │
│ Language: [Vietnamese / English]                 │
│ [Save Preferences]                               │
│                                                   │
│ SYSTEM TAB                                       │
│ API URL: [https://api.cinema.com]                │
│ API Key: [****]  [Regenerate]                    │
│ Max Login Attempts: [5]                          │
│ Session Timeout: [30 min]                        │
│ [Save Settings]                                  │
└──────────────────────────────────────────────────┘
```

### Detailed Action Points & API Calls

#### PROFILE TAB (Actions #1-7)

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **1** | **Page Load** | Fetch current user profile | `GET /api/v1/admin/profile` | Admin.1 | ❌ Missing | User full name, email, phone, avatar, cinema, role |
| **2** | **Full Name Field** | Update user's full name | `PATCH /api/v1/admin/profile` with `{ name }` | Admin.1 | ❌ Missing | After blur or manual save |
| **3** | **Email Field** | Change email address | `PATCH /api/v1/admin/profile` with `{ email }` | Admin.1 | ❌ Missing | Requires verification email |
| **4** | **Phone Field** | Update phone number | `PATCH /api/v1/admin/profile` with `{ phone }` | Admin.1 | ❌ Missing | Optional field |
| **5** | **Avatar Upload** | Upload profile picture | `POST /api/v1/admin/upload-avatar` (multipart) | Admin.2 | ❌ Missing | Max 5MB, accepted: jpg/png |
| **6** | **Cinema Dropdown** | Assign cinema | `PATCH /api/v1/admin/profile` with `{ cinemaId }` | Admin.1 | ❌ Missing | Only if multi-cinema access |
| **7** | **[Save Changes] Button** | Save all profile updates | `PATCH /api/v1/admin/profile` (batch) | Admin.1 | ❌ Missing | Full profile update |

#### NOTIFICATIONS TAB (Actions #8-12)

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **8** | **Page Load** | Fetch notification preferences | `GET /api/v1/admin/settings/notifications` | Admin.3 | ❌ Missing | Get all notification toggles |
| **9** | **Toggle: Email on Reservations** | Enable/disable email notifications | `PATCH /api/v1/admin/settings/notifications` with `{ emailOnReservations }` | Admin.3 | ❌ Missing | Real-time update |
| **10** | **Toggle: Daily Summary** | Enable/disable daily revenue email | `PATCH /api/v1/admin/settings/notifications` with `{ dailySummary }` | Admin.3 | ❌ Missing | Sent at specific time |
| **11** | **Toggle: Alerts** | Enable/disable various alerts | `PATCH /api/v1/admin/settings/notifications` with `{ lowInventoryAlert, maintenanceAlert }` | Admin.3 | ❌ Missing | Multiple toggles |
| **12** | **[Save Preferences] Button** | Save all notification settings | `PATCH /api/v1/admin/settings/notifications` (batch) | Admin.3 | ❌ Missing | Full preference update |

#### SECURITY TAB (Actions #13-16)

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **13** | **Page Load** | Load security settings | No API needed initially | - | ✅ Client-only | Just form validation |
| **14** | **Change Password** | Update user password | `POST /api/v1/admin/change-password` with `{ currentPassword, newPassword }` | Admin.4 | ❌ Missing | Requires current password verification |
| **15** | **Enable 2FA Toggle** | Activate two-factor authentication | `POST /api/v1/admin/2fa/enable` | Admin.5 | ❌ Missing | Returns QR code for authenticator app |
| **16** | **View Active Sessions** | List current login sessions | `GET /api/v1/admin/sessions` | Admin.6 | ❌ Missing | IP address, device, login time |

#### APPEARANCE TAB (Actions #17-19)

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **17** | **Page Load** | Fetch appearance settings | `GET /api/v1/admin/settings/appearance` | Admin.7 | ❌ Missing | Theme, language preferences |
| **18** | **Theme Radio (Light/Dark/Auto)** | Change color theme | `PATCH /api/v1/admin/settings/appearance` with `{ theme }` | Admin.7 | ❌ Missing | Apply immediately to UI |
| **19** | **Language Select** | Change language | `PATCH /api/v1/admin/settings/appearance` with `{ language }` | Admin.7 | ❌ Missing | Vietnamese / English |

#### SYSTEM TAB (Actions #20-24)

| # | Location | Action | API Call | API ID | Status | Note |
|---|----------|--------|----------|--------|--------|------|
| **20** | **Page Load** | Fetch system settings | `GET /api/v1/admin/settings/system` | Admin.8 | ❌ Missing | API URL, timeouts, limits |
| **21** | **API URL Field** | Update API endpoint | `PATCH /api/v1/admin/settings/system` with `{ apiUrl }` | Admin.8 | ❌ Missing | For multi-region setup |
| **22** | **API Key Display** | Show masked API key | `GET /api/v1/admin/api-key` | Admin.8 | ❌ Missing | Display only, can't copy |
| **23** | **[Regenerate API Key]** | Generate new API key | `POST /api/v1/admin/api-key/regenerate` | Admin.8 | ❌ Missing | Old key invalidated immediately |
| **24** | **Session Timeout / Max Attempts** | Update system limits | `PATCH /api/v1/admin/settings/system` with `{ sessionTimeout, maxLoginAttempts }` | Admin.8 | ❌ Missing | Global or per-user |

### Workaround Until APIs Ready

```typescript
// Use localStorage for all settings (persistent in browser)
// This is a temporary solution, migrate to backend when ready

interface UserSettings {
  profile: {
    fullName: string
    email: string
    phone: string
    cinemaId: string
    avatar: string // base64 or URL
  }
  notifications: {
    emailOnReservations: boolean
    emailOnCancellations: boolean
    dailySummary: boolean
    lowInventoryAlert: boolean
    maintenanceAlert: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    language: 'vi' | 'en'
  }
  system: {
    apiUrl: string
    sessionTimeout: number // minutes
    maxLoginAttempts: number
  }
}

// Load settings from localStorage
function loadSettings(): UserSettings {
  const saved = localStorage.getItem('adminSettings')
  return saved ? JSON.parse(saved) : getDefaultSettings()
}

// Save settings to localStorage
function saveSettings(settings: UserSettings) {
  localStorage.setItem('adminSettings', JSON.stringify(settings))
  // Trigger app-wide updates (theme, language, etc.)
  applySettings(settings)
}

// Update individual setting
function updateSetting(path: string, value: any) {
  const settings = loadSettings()
  // Deep update: path = 'notifications.dailySummary'
  const keys = path.split('.')
  let current = settings
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
  saveSettings(settings)
}

// Example: Save profile changes
async function saveProfileChanges(profileData) {
  try {
    const settings = loadSettings()
    settings.profile = { ...settings.profile, ...profileData }
    saveSettings(settings)
    toast({ title: 'Profile updated', description: 'Changes saved locally' })
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to save profile' })
  }
}

// Example: Change theme
function applySettings(settings: UserSettings) {
  // Apply theme
  if (settings.appearance.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  
  // Apply language (if i18n implemented)
  if (window.i18n) {
    window.i18n.changeLanguage(settings.appearance.language)
  }
}
```

### ❌ ALL Backend APIs Missing (VERIFIED)

- **ID Admin.1:** Get/Update user profile ❌ NOT FOUND
- **ID Admin.2:** Upload avatar ❌ NOT FOUND
- **ID Admin.3:** Get/Update notification preferences ❌ NOT FOUND
- **ID Admin.4:** Change password ❌ NOT FOUND
- **ID Admin.5:** Enable 2FA ❌ NOT FOUND
- **ID Admin.6:** List active sessions ❌ NOT FOUND
- **ID Admin.7:** Get/Update appearance settings ❌ NOT FOUND
- **ID Admin.8:** Get/Update system settings ❌ NOT FOUND

### Implementation Notes
- ⚠️ **0 out of 24 actions have API support**
- ✅ **Kiểm Chứng:** Backend không có profile/settings endpoints - tất cả đều missing
- **Current Workaround Viable:** Sử dụng localStorage để lưu settings client-side (đủ cho MVP)
- Khi backend ready, migrate từ localStorage → API calls
- Password change + 2FA cần tích hợp Clerk
- Theme/language có thể apply ngay via CSS classes + i18n library
- Settings page uses **localStorage only** for now (client-side persistence)
- When backend APIs ready, migrate from localStorage to API calls
- Password change and 2FA require additional Clerk integration
- Theme and language are applied immediately via CSS classes and i18n library
- System settings (API URL, timeouts) are configuration only, not user-specific
- Can continue with current localStorage approach for MVP

---

## 📝 SUMMARY TABLE - By Implementation Status

### ✅ READY TO IMPLEMENT (34 APIs, 8 Modules)
| Module | APIs | Page | Action Points | Coverage |
|--------|------|------|----------------|----------|
| Movies | 1.1-1.4 | Movies | 11 actions | ✅ 100% mapped |
| Genres | 2.1-2.4 | Genres | 7 actions | ✅ 100% mapped |
| Cinemas | 3.1-3.4 | Cinemas | 8 actions | ✅ 100% mapped |
| Halls | 4.2-4.6 | Halls | 10 actions | ✅ 100% mapped |
| Movie Releases | 6.1-6.4 | Movie Releases | 10 actions | ✅ 100% mapped |
| Ticket Pricing | 7.1-7.2 | Ticket Pricing | 7 actions | ✅ 100% mapped |
| Batch Showtimes | 5.4 | Batch Showtimes | 7 actions | ✅ 100% mapped |
| Reservations | 9.1-9.3 | Reservations | 9 actions | ✅ 100% mapped |

### ⚠️ NEED WORKAROUND (3 APIs, 3 Modules)
| Module | Missing API | Page | Action Points | Workaround |
|--------|-------------|------|----------------|-----------|
| Halls List | 4.1 (GET /halls) | Halls | 10 | Combine 3.1 + 5.2 (loop) |
| Showtimes | 5.1 (flexible filters) | Showtimes | 13 | Combine cinemas + movies + filter |
| Showtime Seats | 5.1 (flexible filters) | Showtime Seats | 5 | Same as Showtimes workaround |

### ❌ NEED BACKEND IMPLEMENTATION (21 APIs, 5 Modules)
| Module | Missing APIs | Page | Action Points | Effort | Priority |
|--------|-------------|------|----------------|--------|----------|
| Staff | 8.1-8.4 (4 APIs) | Staff | 9 | 10-15 hrs | 🔴 HIGH |
| Reports | 10.2-10.6 (5 APIs) | Reports | 9 | 15-20 hrs | 🟡 MEDIUM |
| Reviews | 11.1-11.4 (4 APIs) | Reviews | 10 | 10-12 hrs | 🟡 MEDIUM |
| Settings | Admin.1-8 (8 APIs) | Settings | 24 | 10-15 hrs | 🟢 LOW |

### 📊 TOTAL API COVERAGE ACROSS ALL 15 PAGES
- **Total Action Points Mapped:** 147 unique actions across 15 dashboard pages
- **APIs Ready:** 34 endpoints (23% fully usable)
- **APIs with Workaround:** 3 endpoints (2% viable with client-side workaround)
- **APIs Missing:** 21 endpoints (15% need backend implementation)
- **Current Status:** 37 of 47 backend APIs have frontend mapping ready

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### ✅ Phase 1: MVP (Week 1-2) - Ready Now (34 APIs Ready)

**All features can be deployed immediately with existing backend:**

1. **Movies Page** (11 actions)
   - ✅ CRUD: List, Create, Edit, Delete movies
   - ✅ Add release action links to Movie Releases page
   - **Status:** 100% ready to implement

2. **Genres Page** (7 actions)
   - ✅ CRUD: Simple list, create, edit, delete
   - **Status:** 100% ready to implement

3. **Cinemas Page** (8 actions)
   - ✅ CRUD: Manage cinema locations
   - ✅ Status toggle (active/inactive)
   - **Status:** 100% ready to implement

4. **Halls Page** (10 actions)
   - ⚠️ List halls: Use workaround (GET /cinemas + loop GET /halls/:cinemaId)
   - ✅ CRUD: Create, edit, delete, view seats
   - **Status:** 95% ready (workaround documented)

5. **Ticket Pricing Page** (7 actions)
   - ✅ Pricing matrix: 5 seat types × 3 day types
   - ✅ Update individual prices
   - ✅ Bulk apply pricing across halls
   - **Status:** 100% ready to implement

6. **Seat Status Page** (10 actions)
   - ✅ Visual seat map with color coding
   - ✅ Update individual seat status
   - ✅ Bulk update multiple seats
   - **Status:** 100% ready to implement

7. **Batch Showtimes Page** (7 actions)
   - ✅ Create bulk showtimes with repeat patterns (DAILY/WEEKLY)
   - ✅ Cascading dropdowns: Movie → Release, Cinema → Hall
   - **Status:** 100% ready to implement

8. **Movie Releases Page** (10 actions)
   - ✅ List releases by movie
   - ✅ CRUD: Create, edit, delete
   - ✅ Pre-populate batch-showtimes page
   - **Status:** 100% ready to implement

### ⚠️ Phase 2: Core Features (Week 3-4) - With Workaround (3 APIs)

**All features can work with client-side workarounds:**

9. **Showtimes Page** (13 actions)
   - ⚠️ Filter by date/cinema/movie: Use workaround
     - Load all cinemas + movies
     - Create cartesian product
     - Filter by date client-side
   - ✅ Create single showtime
   - ✅ Edit & delete showtimes
   - ✅ View seats
   - **Status:** 95% ready (workaround included, 3-4 extra API calls needed)

10. **Showtime Seats Page** (5 actions)
    - ⚠️ Uses same filtering workaround as Showtimes page
    - ✅ View/display seat map
    - **Status:** 95% ready (workaround included)

11. **Reservations Page** (9 actions)
    - ✅ List bookings with filters (status, date range)
    - ✅ View booking details
    - ✅ Update booking status (confirmed/cancelled/refunded)
    - **Status:** 100% ready to implement

### ❌ Phase 3: Enhanced Features (Week 5+) - Need Backend APIs (21 APIs)

**Blocked until backend APIs implemented:**

12. **Reports Page** (9 actions)
    - ⚠️ Revenue over time: Partial (ID 10.1 available)
    - ❌ Revenue by cinema: Need ID 10.2
    - ❌ Revenue by movie: Need ID 10.3
    - ❌ Occupancy rate: Need ID 10.4
    - ❌ Peak hours: Need ID 10.5
    - ❌ Ticket sales by type: Need ID 10.6
    - **Status:** 11% ready (workaround possible but requires extra aggregation)
    - **Recommended:** Wait for backend 10.2-10.6

13. **Staff Page** (9 actions)
    - ❌ ALL staff CRUD operations blocked
    - ❌ Need: ID 8.1 (List), 8.2 (Create), 8.3 (Update), 8.4 (Delete)
    - ⚠️ Temporary workaround: Use GET /users + filter, but incomplete
    - **Status:** 0% ready
    - **Recommended:** CRITICAL - High priority backend request

14. **Reviews Page** (10 actions)
    - ❌ ALL review operations blocked
    - ❌ Need: ID 11.1 (List), 11.2 (Details), 11.3 (Update), 11.4 (Delete)
    - **Status:** 0% ready (can use mock data temporarily)
    - **Recommended:** Medium priority, can defer to Week 6+

15. **Settings Page** (24 actions)
    - ❌ ALL settings operations use localStorage
    - ⚠️ Profile: Need ID Admin.1-2 (can use Clerk)
    - ⚠️ Notifications: Need ID Admin.3
    - ⚠️ Security: Need ID Admin.4-6 (requires Clerk integration)
    - ⚠️ Appearance: Need ID Admin.7
    - ⚠️ System: Need ID Admin.8
    - **Status:** 0% ready (localStorage fallback works for MVP)
    - **Recommended:** Low priority, can use localStorage for MVP

---

## 🔧 CRITICAL BACKEND PRIORITIES

### 🔴 HIGH PRIORITY (Blocking Core Features - Implement First)

1. **ID 5.1:** `GET /api/v1/showtimes/admin?date=xxx&cinemaId=xxx&movieId=xxx&page=1&limit=20`
   - **Blocks:** Showtimes page, Showtime-Seats page (13+5 actions)
   - **Impact:** Enables flexible filtering instead of complex workaround
   - **Effort:** 3-4 hours
   - **Payoff:** HIGH (eliminates cartesian product + 6-10 API calls per filter)
   - **User Impact:** Better performance, cleaner code, faster page loads

2. **ID 8.1-8.4:** Staff CRUD endpoints (4 related APIs)
   - **Blocks:** Entire Staff page (9 actions)
   - **Includes:** Get list, Create, Update, Delete staff
   - **Effort:** 10-15 hours (includes Clerk integration + database schema)
   - **Payoff:** CRITICAL (completely non-functional without these)
   - **User Impact:** Cannot manage staff without this

3. **ID 4.1:** `GET /api/v1/halls?cinemaId=xxx` (optional parameter)
   - **Blocks:** Inefficient Halls list workaround (10 actions)
   - **Effort:** 1-2 hours (simple parameter addition)
   - **Payoff:** MEDIUM (workaround viable but slow)
   - **User Impact:** Quick-win, improves performance slightly

### 🟡 MEDIUM PRIORITY (Enhanced Features - Implement Second)

4. **ID 10.2-10.6:** Report analytics endpoints (5 related APIs)
   - **Blocks:** Reports page enhanced features (9 actions)
   - **Includes:** Revenue by cinema, by movie, occupancy, ticket sales, peak hours
   - **Effort:** 15-20 hours total (complex aggregations)
   - **Payoff:** MEDIUM (core reporting functionality)
   - **User Impact:** Dashboard insights and analytics

5. **ID 11.1-11.4:** Reviews management endpoints (4 related APIs)
   - **Blocks:** Reviews page moderation (10 actions)
   - **Effort:** 10-12 hours
   - **Payoff:** LOW (nice-to-have feature)
   - **User Impact:** Review moderation capability

### 🟢 LOW PRIORITY (Can Wait - Implement Later)

6. **Admin.1-8:** Settings and profile endpoints (8 related APIs)
   - **Blocks:** Settings page features (24 actions)
   - **Effort:** 10-15 hours
   - **Current Status:** localStorage fallback works for MVP
   - **Payoff:** LOW (settings can persist in browser)
   - **User Impact:** Cross-device sync, cloud backup

---

## ✅ FRONTEND IMPLEMENTATION CHECKLIST

### Week 1-2: Implement Phase 1 (Ready Now)
- [ ] **Movie Management Page** (11 API calls mapped)
  - [ ] GET /api/v1/movies - Display list
  - [ ] POST /api/v1/movies - Create new
  - [ ] PUT /api/v1/movies/:id - Edit
  - [ ] DELETE /api/v1/movies/:id - Delete
  - [ ] GET /api/v1/genres - Populate dropdown
  - [ ] POST /api/v1/movie-releases - "Add Release" action
  
- [ ] **Genre Management Page** (7 API calls)
  - [ ] Full CRUD operations
  
- [ ] **Cinema Management Page** (8 API calls)
  - [ ] Full CRUD operations
  
- [ ] **Hall Management Page** (10 API calls - with workaround)
  - [ ] ⚠️ Implement: `GET /cinemas/filters` → loop `GET /halls/:cinemaId`
  - [ ] CRUD operations
  
- [ ] **Ticket Pricing Page** (7 API calls)
  - [ ] Load pricing matrix
  - [ ] Update individual prices
  - [ ] Bulk apply across halls
  
- [ ] **Seat Status Page** (10 API calls)
  - [ ] Visualize seat map
  - [ ] Update seat status
  - [ ] Bulk operations
  
- [ ] **Batch Showtimes Page** (7 API calls)
  - [ ] Cascading dropdowns
  - [ ] Bulk create with repeat patterns
  
- [ ] **Movie Releases Page** (10 API calls)
  - [ ] List by movie
  - [ ] CRUD operations
  - [ ] Link to batch-showtimes

### Week 3-4: Implement Phase 2 (With Workaround)
- [ ] **Showtimes Page** (13 API calls - with workaround)
  - [ ] ⚠️ Implement: Flexible filtering workaround
  - [ ] Create, edit, delete
  - [ ] View seats
  
- [ ] **Showtime Seats Page** (5 API calls - with workaround)
  - [ ] ⚠️ Use Showtimes filtering workaround
  - [ ] Seat map display
  
- [ ] **Reservations Page** (9 API calls)
  - [ ] List with filters
  - [ ] View details
  - [ ] Update status

### Week 5+: Phase 3 (After Backend Implementation)
- [ ] **Reports Page** (requires 10.2-10.6 + 5.1)
- [ ] **Staff Page** (requires 8.1-8.4)
- [ ] **Reviews Page** (requires 11.1-11.4)
- [ ] **Settings Page** (requires Admin.1-8, or keep localStorage)

---
   - **Effort:** Medium-High (15-20 hours)
   - **Recommend:** After core features working

5. **ID 11.1-11.4:** Reviews endpoints
   - **Blocks:** Reviews page entirely
   - **Effort:** Medium (10-12 hours)
   - **Recommend:** After core features working

### 🟢 LOW PRIORITY (Polish)
6. **ID Admin.1-8:** Settings/Profile endpoints
   - **Blocks:** Settings page (localStorage workaround viable)
   - **Effort:** Low (10-15 hours)
   - **Recommend:** Last, after MVP features

---

## 📋 CHECKLIST FOR FRONTEND INTEGRATION

- [ ] **Phase 1: Setup**
  - [ ] Review API_ALIGNMENT_GUIDE.md (done ✅)
  - [ ] Update API base URL in `lib/api.ts`
  - [ ] Remove mock data imports from phase 1 pages
  - [ ] Implement real API calls

- [ ] **Phase 1: Movies Module**
  - [ ] `GET /api/v1/movies` - List with pagination
  - [ ] `POST /api/v1/movies` - Create
  - [ ] `PUT /api/v1/movies/:id` - Update
  - [ ] `DELETE /api/v1/movies/:id` - Delete
  - [ ] `GET /api/v1/genres` - Dropdown

- [ ] **Phase 1: Genres Module**
  - [ ] `GET /api/v1/genres` - List
  - [ ] `POST /api/v1/genres` - Create
  - [ ] `PUT /api/v1/genres/:id` - Update
  - [ ] `DELETE /api/v1/genres/:id` - Delete

- [ ] **Phase 1: Cinemas Module**
  - [ ] `GET /api/v1/cinemas/filters` - List
  - [ ] `POST /api/v1/cinemas/cinema` - Create
  - [ ] `PATCH /api/v1/cinemas/cinema/:id` - Update
  - [ ] `DELETE /api/v1/cinemas/cinema/:id` - Delete

- [ ] **Phase 1: Halls Module** (with workaround)
  - [ ] Implement workaround: `GET /cinemas/filters` + loop `GET /halls/cinema/:id`
  - [ ] `GET /api/v1/halls/hall/:id` - Details
  - [ ] `POST /api/v1/halls/hall` - Create
  - [ ] `PATCH /api/v1/halls/hall/:id` - Update
  - [ ] `DELETE /api/v1/halls/hall/:id` - Delete

- [ ] **Phase 1: Seat Status Module**
  - [ ] `GET /api/v1/halls/hall/:id` - Get seats
  - [ ] `PATCH /api/v1/halls/seat/:id/status` - Update status

- [ ] **Phase 1: Ticket Pricing Module**
  - [ ] `GET /api/v1/cinemas/filters` - Cinema dropdown
  - [ ] `GET /api/v1/halls/cinema/:id` - Hall dropdown
  - [ ] `GET /api/v1/ticket-pricings/hall/:id` - List prices
  - [ ] `PATCH /api/v1/ticket-pricings/pricing/:id` - Update

- [ ] **Phase 1: Batch Showtimes Module**
  - [ ] `GET /api/v1/movies` - Movie dropdown
  - [ ] `GET /api/v1/movies/:id/releases` - Release dropdown
  - [ ] `GET /api/v1/cinemas/filters` - Cinema dropdown
  - [ ] `GET /api/v1/halls/cinema/:id` - Hall dropdown
  - [ ] `POST /api/v1/showtimes/batch` - Create batch

- [ ] **Phase 1: Movie Releases Module**
  - [ ] `GET /api/v1/movies/:id/releases` - List by movie
  - [ ] `POST /api/v1/movie-releases` - Create
  - [ ] `PUT /api/v1/movie-releases/:id` - Update
  - [ ] `DELETE /api/v1/movie-releases/:id` - Delete

- [ ] **Phase 2: Showtimes Module** (after backend ID 5.1)
  - [ ] Wait for `GET /api/v1/showtimes/admin` OR implement workaround
  - [ ] `GET /api/v1/halls/cinema/:id` - Hall dropdown
  - [ ] `POST /api/v1/showtimes/showtime` - Create single
  - [ ] `PATCH /api/v1/showtimes/showtime/:id` - Update
  - [ ] `DELETE /api/v1/showtimes/showtime/:id` - Delete

- [ ] **Phase 2: Showtime Seats Module** (after backend ID 5.1)
  - [ ] Implement workaround for showtime filtering
  - [ ] `GET /api/v1/showtimes/:id/seats` - Seat map

- [ ] **Phase 2: Reservations Module**
  - [ ] `GET /api/v1/bookings/admin/all` - List with filters
  - [ ] `GET /api/v1/bookings/:id/summary` - Details
  - [ ] `PUT /api/v1/bookings/admin/:id/status` - Update status

- [ ] **Phase 3: Reports Module** (after backend 10.1-10.6)
  - [ ] `GET /api/v1/bookings/admin/revenue-report` - Revenue (ID 10.1)
  - [ ] `GET /api/v1/reports/revenue-by-cinema` - (ID 10.2, waiting)
  - [ ] `GET /api/v1/reports/revenue-by-movie` - (ID 10.3, waiting)
  - [ ] `GET /api/v1/reports/occupancy` - (ID 10.4, waiting)
  - [ ] `GET /api/v1/reports/ticket-sales` - (ID 10.5, waiting)
  - [ ] `GET /api/v1/reports/peak-hours` - (ID 10.6, waiting)

- [ ] **Phase 3: Staff Module** (after backend 8.1-8.4)
  - [ ] `GET /api/v1/staff` - List (ID 8.1, waiting)
  - [ ] `POST /api/v1/staff` - Create (ID 8.2, waiting)
  - [ ] `PATCH /api/v1/staff/:id` - Update (ID 8.3, waiting)
  - [ ] `DELETE /api/v1/staff/:id` - Delete (ID 8.4, waiting)

- [ ] **Phase 3: Reviews Module** (after backend 11.1-11.4)
  - [ ] `GET /api/v1/reviews` - List (ID 11.1, waiting)
  - [ ] `GET /api/v1/reviews/:id` - Details (ID 11.2, waiting)
  - [ ] `PATCH /api/v1/reviews/:id/status` - Update (ID 11.3, waiting)
  - [ ] `DELETE /api/v1/reviews/:id` - Delete (ID 11.4, waiting)

- [ ] **Phase 3: Settings Module** (after backend Admin.1-8)
  - [ ] Profile endpoints (Admin.1-2, waiting)
  - [ ] Notification endpoints (Admin.3-4, waiting)
  - [ ] Security endpoints (Admin.5-6, waiting)
  - [ ] Appearance endpoints (Admin.7-8, waiting)

---

**Document prepared by:** AI Assistant  
**Last updated:** 2025-12-17  
**Status:** Ready for Frontend Implementation Planning
