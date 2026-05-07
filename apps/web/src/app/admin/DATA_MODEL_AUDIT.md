# Admin Data Model Audit - Field Consistency & Relationships Analysis

**Date**: December 24, 2025  
**Status**: Complete Field Logic Review

---

## 🔍 Executive Summary

**Overall Assessment**: The data model has **moderate inconsistencies** that need clarification:

| Issue Level | Count | Severity | Examples |
|------------|-------|----------|----------|
| **Redundant Fields** | 3 | Medium | Language fields (Movie vs Showtime), Release Date in multiple places |
| **Naming Inconsistencies** | 2 | Medium | `language` vs `languageType`, `startTime` formats |
| **Missing Context** | 2 | Low | Format field definition, Subtitle field purpose |
| **Logical Issues** | 2 | Low | Release date relevance in movies, Timezone usage |

---

## 1. LANGUAGE FIELDS - Main Inconsistency ⚠️

### Problem: Three Overlapping Language Concepts

**Movies Table Has:**
```typescript
1. originalLanguage: string       // e.g., "en", "vi"
2. spokenLanguages: string[]      // e.g., ["en", "vi"] - available audio tracks
3. languageType: LanguageOptionEnum // "ORIGINAL" | "SUBTITLE" | "DUBBED"
```

**Showtimes Table Has:**
```typescript
1. language: string               // e.g., "vi", "en" 
2. subtitles: string[]            // e.g., ["vi", "en"]
3. [NO languageType field]
```

### What Each Field Actually Means:

| Field | Movie | Showtime | Purpose | Example |
|-------|-------|----------|---------|---------|
| **originalLanguage** | ✅ YES | ❌ MISSING | Original production language | "en" (English production) |
| **spokenLanguages** | ✅ YES | ❌ MISSING | Available audio tracks | ["en", "vi"] (can watch in English or Vietnamese) |
| **languageType** | ✅ YES | ❌ MISSING | **Default presentation mode for this cinema/showtime** | "DUBBED" (show Vietnamese dubbed version) |
| **language** | ❌ NO | ✅ YES | **Specific audio track for THIS showtime** | "vi" (this specific showing plays in Vietnamese) |
| **subtitles** | ❌ NO | ✅ YES | **Available subtitles for THIS showtime** | ["vi", "en"] (customers can choose subtitles) |

### Current Logic (Correct But Confusing):

**Movie Database Storage:**
```
Movie: "Crazy Rich Asians"
- originalLanguage: "en"           // Made in English
- spokenLanguages: ["en", "vi"]    // We have English & Vietnamese dubs
- languageType: "DUBBED"           // Default: show the dubbed version
```

**Showtime Scheduling:**
```
Showtime 1:
- movieId: "crazy-rich-asians"
- language: "vi"                   // But THIS showing plays in Vietnamese
- subtitles: ["vi"]                // WITH Vietnamese subtitles
- format: "2D"

Showtime 2:
- movieId: "crazy-rich-asians"
- language: "en"                   // This OTHER showing plays in English
- subtitles: ["en", "vi"]          // WITH English AND Vietnamese subtitles
- format: "3D"
```

### ✅ Recommendation: CLARIFY, Not Change

**Current design is CORRECT but needs documentation:**

1. **Movie-level fields** = Movie METADATA (what audio versions exist)
   - `originalLanguage`: Production language (informational)
   - `spokenLanguages`: Available audio tracks (what you can produce)
   - `languageType`: Default presentation preference (for UI defaults)

2. **Showtime-level fields** = Specific SESSION settings (what's playing when)
   - `language`: Actual audio for THIS showing (operational)
   - `subtitles`: Actual subtitles for THIS showing (operational)

**Action**: Add comments in code explaining these are complementary, not redundant.

---

## 2. RELEASE DATE - Questionable Placement

### Current Structure:

```
Movies Table:
├── releaseDate ✅ (meaningful - when it premiered)

Movie Releases Table:
├── movieId
├── cinemaId
├── startDate ✅ (when we start showing it in THIS cinema)
└── endDate ✅ (when we stop showing it in THIS cinema)

Showtimes Table:
├── movieId
├── movieReleaseId
├── startTime ✅ (when THIS showing starts)
└── [NO release date info]
```

### Analysis:

| Field | Location | Business Meaning | Redundancy? |
|-------|----------|------------------|------------|
| **releaseDate** | Movies | When movie premiered nationally/globally | ✅ Informational (historical) |
| **startDate/endDate** | MovieReleases | When we show it in EACH cinema | ✅ Critical (per-location scheduling) |
| **startTime** | Showtimes | When specific showing starts | ✅ Critical (per-session scheduling) |

### ✅ Verdict: CORRECT STRUCTURE

- `Movie.releaseDate` = Historical info (for marketing)
- `MovieRelease.startDate/endDate` = Distribution window per cinema
- `Showtime.startTime` = Individual session time

**These are NOT redundant - they serve different purposes:**
1. Marketing knows when it premiered (Movie.releaseDate)
2. Operations know when to show it per location (MovieRelease.dates)
3. Customers see when shows start (Showtime.startTime)

**Action**: Keep as-is. This is hierarchical relationship structure.

---

## 3. FORMAT FIELD - Unclear Definition ⚠️

### Current Usage:

```typescript
Movie Releases: NO format field
Showtimes: 
├── format: "2D" | "3D" | "IMAX" | "FOUR_DX"

Halls:
├── screenType: "70mm" | "Regular" | "3D"
```

### Confusion:

- **Hall.screenType** = Physical hardware capability
- **Showtime.format** = How this specific showing is projected

### Example:

```
Hall 3 (IMAX Hall):
├── screenType: "70mm"     // Physical IMAX screen

Showtime in Hall 3:
├── format: "IMAX"         // Showing formatted for IMAX
├── format: "3D"           // OR showing formatted for 3D
├── format: "2D"           // OR showing formatted for 2D
```

### ✅ Verdict: CORRECT BUT CONFUSING

**The relationship:**
- Hall has physical capability (screenType)
- Showtime specifies which format to use for THAT showing
- Validation should ensure `showtime.format` ≤ `hall.screenType` capability

**Potential Issue**: No validation preventing scheduling "IMAX" format in a standard 2D hall.

**Action**: 
1. Add comment distinguishing Hall capability vs Showtime format
2. Add backend validation to prevent format mismatch

---

## 4. LANGUAGE IN MOVIES - Redundant Field? 

### Three Language Fields in Movies:

```typescript
originalLanguage: "en"
spokenLanguages: ["en", "vi"]
languageType: "DUBBED"
```

### Question: Is `languageType` Redundant?

**No - it serves a purpose:**

- `originalLanguage` = Production fact (read-only)
- `spokenLanguages` = What versions we have (informational)
- `languageType` = **Default showtime preference** (operational)

Example:
```
Movie: "Avengers" (American film)
- originalLanguage: "en"        // Made in English
- spokenLanguages: ["en", "vi"] // We have 2 versions
- languageType: "DUBBED"        // When creating showtimes, default to Vietnamese dubbed
```

### ✅ Verdict: CORRECT & NECESSARY

This is **smart data modeling** - the admin can set a default preference for new showtimes.

---

## 5. CINEMA LOCATION DATA - Redundancy Check

### Fields Present:

```typescript
Cinema:
├── address: "123 Nguyen Huu Canh"       ✅ Street address
├── city: "Ho Chi Minh"                  ✅ City
├── district: "Binh Thanh"               ✅ District
├── latitude: 10.8231                    ✅ GPS coordinate
├── longitude: 106.7011                  ✅ GPS coordinate
├── timezone: "Asia/Ho_Chi_Minh"         ✅ Timezone
```

### Potential Redundancy:

- `address` + `city` + `district` = Three ways to specify location?
- Should be: `address` is full text, `district` is normalized, `city` is derived

### Issues:

1. **No validation** that address is in specified city/district
2. **Timezone should be AUTO-DERIVED** from city, not manually entered
3. **District could be auto-geocoded** from lat/lng

### ✅ Current Status: WORKS BUT COULD BE SMARTER

**Recommendation**:
- Keep address as **free text** (customer navigation)
- Keep city/district as **categorical** (filtering)
- Latitude/longitude for **mapping**
- Timezone should **DERIVE FROM COORDINATES or LOCK to Vietnam** (all same)

---

## 6. STAFF POSITION - Complex but Correct

### Current Fields:

```typescript
position: CINEMA_MANAGER | ASSISTANT_MANAGER | TICKET_CLERK | 
          CONCESSION_STAFF | USHER | PROJECTIONIST | CLEANER | SECURITY

workType: FULL_TIME | PART_TIME | CONTRACT
shiftType: MORNING | AFTERNOON | NIGHT
```

### Cross-Checking Logic:

| Position | Valid WorkTypes | Valid ShiftTypes | Notes |
|----------|-----------------|-----------------|-------|
| CINEMA_MANAGER | FULL_TIME only | Any | Manager works all shifts |
| PROJECTIONIST | FULL_TIME, PART_TIME | MORNING, AFTERNOON | No night projectionist? |
| CLEANER | FULL_TIME, PART_TIME | NIGHT preferred | Cleans after midnight |
| SECURITY | FULL_TIME, PART_TIME | Any | 24hr coverage needed |

### ✅ Verdict: CORRECT STRUCTURE but **NO VALIDATION**

**Issue**: Can schedule a Cleaner on morning shift (should be rare).

**Recommendation**: Add business rule validation:
```typescript
const VALID_COMBINATIONS = {
  CLEANER: { shifts: [NIGHT] },
  PROJECTIONIST: { shifts: [MORNING, AFTERNOON] },
  MANAGER: { shifts: [ALL] }
  // ...
}
```

---

## 7. TICKET PRICING - Three-Level Hierarchy

### Structure:

```
Cinema
├── Hall 1
│   ├── Seat Type: STANDARD
│   │   ├── WEEKDAY: 90,000 VND
│   │   ├── WEEKEND: 120,000 VND
│   │   └── HOLIDAY: 150,000 VND
│   ├── Seat Type: VIP
│   │   ├── WEEKDAY: 150,000 VND
│   │   ├── WEEKEND: 180,000 VND
│   │   └── HOLIDAY: 200,000 VND
```

### Questions:

1. **Should pricing be by Showtime instead of Hall?** ❌ NO
   - Why: Different movies, different prices = complexity
   - Current approach (per-hall pricing) is correct

2. **Missing: Price overrides per Showtime?** ⚠️ MAYBE
   - Special events might have different prices
   - Consider adding `ShowtimePrice` override table

### ✅ Verdict: CORRECT CORE STRUCTURE

Current pricing matrix (Hall × Seat Type × Day Type) is standard cinema model.

---

## 8. BOOKING STATUS vs PAYMENT STATUS

### Current Design:

```typescript
// Booking (Reservation) Status
PENDING → CONFIRMED → CANCELLED, EXPIRED

// Payment Status
UNPAID → PAID → REFUNDED
```

### Logic Check:

```
Scenario 1: Customer books and pays
├── bookingStatus: PENDING
├── paymentStatus: UNPAID
   ↓ (customer pays)
├── bookingStatus: CONFIRMED
├── paymentStatus: PAID
   ✅ Correct: Two independent status flows

Scenario 2: Customer books but doesn't pay before deadline
├── bookingStatus: PENDING
├── paymentStatus: UNPAID
   ↓ (deadline passes)
├── bookingStatus: EXPIRED
├── paymentStatus: UNPAID
   ✅ Correct: Booking expires, payment status irrelevant

Scenario 3: Customer cancels after paying
├── bookingStatus: CONFIRMED
├── paymentStatus: PAID
   ↓ (customer cancels)
├── bookingStatus: CANCELLED
├── paymentStatus: REFUNDED
   ✅ Correct: Booking cancelled, money returned
```

### ✅ Verdict: EXCELLENT DESIGN

Two independent axes (booking state vs money state) handles all scenarios correctly.

---

## 9. MOVIE REVIEWS - Missing Context

### Current Fields:

```typescript
Review:
├── rating: 1-5              // Star rating
├── comment: string          // Review text
├── movieId: string          // Which movie
├── [NO showtime reference]  // Can't tell WHICH showing they watched
```

### Missing Information:

**Question**: Should review link to a specific showtime/cinema?

**Current Design**: Global review for movie (like IMDb)
- ✅ Simplest
- ✅ Review is about movie quality, not cinema experience

**Alternative**: Review specific cinema/format/experience
- ⚠️ More complex
- ⚠️ Would split reviews by cinema

### ✅ Verdict: CURRENT DESIGN IS CORRECT

Reviews are movie-level, not cinema-level. Good choice.

---

## 10. SEAT STATUS - Sufficient Data?

### Current Fields:

```typescript
Seat:
├── seatStatus: ACTIVE | BROKEN | MAINTENANCE
├── reservationStatus: AVAILABLE | HELD | CONFIRMED | CANCELLED
├── seatType: STANDARD | VIP | COUPLE | PREMIUM | WHEELCHAIR
```

### Question: Missing ShowtimeId?

**Current**: Seat status is per-Hall
**Issue**: Same seat can be SOLD in one showtime, AVAILABLE in another

**Structure**:
```
Hall 3, Seat A1:
├── seatType: VIP (physical property)
├── seatStatus: ACTIVE (hardware status)
└── reservationStatus[Showtime1]: CONFIRMED (sold)
└── reservationStatus[Showtime2]: AVAILABLE (free)
```

### ✅ Verdict: CORRECT - Reservation Status is per-Showtime

The system correctly separates:
- **Seat properties** (type, hardware status) = per-hall
- **Reservation status** = per-showtime

---

## 11. SHOWTIMES - Missing Quantity Fields?

### Current Fields:

```typescript
Showtime:
├── movieId
├── cinemaId
├── hallId
├── startTime
├── format: "2D" | "3D" | "IMAX"
├── language: "vi" | "en" | etc
├── subtitles: ["vi", "en"]
├── status: SELLING | STOPPED | CANCELLED
└── [NO availableSeats field]
```

### Missing Field: Available Seats Count

**Current Reality**: System calculates at runtime
```
availableSeats = hallCapacity - bookedSeats
```

**Should it be stored?** ❌ NO (redundant)
- Hall capacity is static
- Bookings are updated live
- Calculated field is better

### ✅ Verdict: CORRECT - No need to store

---

## Summary of Findings

### ✅ Correct Designs:
1. **Language fields** - Complementary, not redundant (Movie metadata + Showtime operational)
2. **Release dates** - Hierarchical (National premiere → Cinema window → Specific showtime)
3. **Booking vs Payment status** - Independent axes (handles all scenarios)
4. **Ticket pricing** - Logical hierarchy (Cinema → Hall → Seat Type → Day)
5. **Reviews** - Movie-level (correct choice)
6. **Seat tracking** - Properties vs reservations separation

### ⚠️ Need Clarification/Validation:

| Issue | Severity | Action |
|-------|----------|--------|
| Language field naming | Medium | Add code comments explaining purpose |
| Format vs ScreenType | Medium | Add backend validation |
| Staff shift combinations | Medium | Add business rule validation |
| Cinema timezone | Low | Consider auto-deriving from coordinates |
| Cinema redundant locations | Low | Add validation linking address/city/district |

### 📋 Recommended Actions:

**Priority 1 (Do Now):**
- [ ] Add comments in code explaining language field purposes
- [ ] Add backend validation: `showtime.format` must match `hall.screenType` capability
- [ ] Add validation: Position + WorkType combinations (no Part-Time managers)

**Priority 2 (Consider):**
- [ ] Add ShowtimePrice override table for special event pricing
- [ ] Auto-derive timezone from coordinates or lock to Vietnam
- [ ] Add address validation (address must be in specified city/district)

**Priority 3 (Documentation):**
- [ ] Document why these seemingly redundant fields exist
- [ ] Create data model diagram showing relationships
- [ ] Add API documentation for each field's purpose

---

## Data Model Correctness Verdict

**Overall: 8.5/10** ✅

The data model is **fundamentally sound** with good separation of concerns. The "redundancy" is actually **smart design** (different data for different purposes). Main improvements are:

1. **Validation**: Add business rule enforcement
2. **Documentation**: Explain field purposes clearly
3. **Comments**: Mark why complementary fields exist

The current design is **production-ready** but could benefit from explicit validation and documentation.

