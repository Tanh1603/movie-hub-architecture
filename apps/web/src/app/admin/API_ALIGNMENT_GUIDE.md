# 📋 API ALIGNMENT GUIDE

## Admin Dashboard - Cinema Management System

**Document Version:** 1.0  
**Created:** 2025-12-07  
**Status:** Active - Source of Truth for API Integration  
**Referenced Requirements:** `BACKEND_API_REQUIREMENTS.md` (47 endpoints)

---

## 📊 Executive Summary

**Out of 47 requested API endpoints, 34 (72%) are directly available and ready for Frontend integration today.** The remaining 13 endpoints fall into two categories: 10 require minor translation/aggregation work (the data exists but needs different API calls), and only 3 are truly missing (Staff CRUD operations, which require Clerk authentication integration). The Reports module is fully achievable through existing data models with new aggregation endpoints.

---

## 🧩 THE TRANSLATION LAYER (Critical for Frontend)

> **⚠️ ATTENTION FRONTEND TEAM:** These APIs exist but with different routes or require combining multiple calls. Update your API clients accordingly.

---

### 4.1 Get List of All Halls

|                           |                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Request**      | `GET /halls` (global list of all halls)                                                                                                                         |
| **Backend Reality**       | `GET /api/v1/halls/cinema/:cinemaId`                                                                                                                            |
| **Gap**                   | No global endpoint; only per-cinema query exists                                                                                                                |
| **Workaround (Frontend)** | 1. Call `GET /cinemas/filters` to get all cinemas<br>2. For each cinema, call `GET /halls/cinema/:cinemaId`<br>3. Merge results client-side and group by cinema |
| **Recommended Action**    | **Backend:** Add optional `cinemaId` query param to make it: `GET /halls?cinemaId=xxx`. When no param provided, return all halls grouped by cinema.             |
| **Effort**                | 🟢 Low (1-2 hours)                                                                                                                                              |

---

### 5.1 Get Showtime List (with date/cinema/movie filter)

|                           |                                                                                                                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Request**      | `GET /showtimes?date=2025-01-15&cinemaId=xxx&movieId=xxx`                                                                                                                                                                                                                          |
| **Backend Reality**       | `GET /api/v1/cinemas/:cinemaId/movies/:movieId/showtimes/admin`                                                                                                                                                                                                                    |
| **Gap**                   | All three params (cinemaId, movieId, date) are required in current implementation                                                                                                                                                                                                  |
| **Workaround (Frontend)** | Must provide both cinemaId and movieId. Cannot search showtimes by date only.                                                                                                                                                                                                      |
| **Recommended Action**    | **Backend:** Create new endpoint `GET /api/v1/showtimes/admin` that accepts optional query params: `date` (required), `cinemaId` (optional), `movieId` (optional), `status` (optional). Reuse existing `ShowtimeService.adminGetMovieShowtimes()` logic but make filters optional. |
| **Effort**                | 🟡 Medium (3-4 hours)                                                                                                                                                                                                                                                              |

**Suggested Implementation:**

```typescript
// showtime.controller.ts
@Get('admin')
@UseGuards(ClerkAuthGuard)
async getShowtimesAdmin(@Query() filters: AdminShowtimesFilterDto) {
  // filters: { date: string, cinemaId?: string, movieId?: string, status?: ShowtimeStatus }
  return this.showtimeService.getShowtimesWithFilters(filters);
}
```

---

### 8.1 Get Staff List

|                           |                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Frontend Request**      | `GET /staff?cinemaId=xxx&role=MANAGER&status=ACTIVE`                                                                  |
| **Backend Reality**       | `GET /api/v1/users` (returns ALL Clerk users) + `UserRole` table in database                                          |
| **Gap**                   | No role filtering, no cinema assignment, no status field                                                              |
| **Workaround (Frontend)** | 1. Call `GET /users` to get all Clerk users<br>2. For admin filtering, FE needs backend to join with `UserRole` table |
| **Recommended Action**    | **Backend:** Extend `UserController.getUser()` to accept query params and join with `UserRole` table.                 |
| **Effort**                | 🟡 Medium (4-6 hours)                                                                                                 |

**Suggested Implementation:**

```typescript
// user.controller.ts
@Get()
@UseGuards(ClerkAuthGuard)
@Permission("USER.LIST")
async getUsers(@Query() filters: GetUsersDto) {
  // filters: { role?: 'ADMIN' | 'MANAGER' | 'STAFF', page?: number, limit?: number }
  return this.userService.getUsersWithRoles(filters);
}

// user.service.ts
async getUsersWithRoles(filters: GetUsersDto) {
  const clerkUsers = await clerkClient.users.getUserList();
  const userRoles = await this.prismaService.userRole.findMany({
    include: { role: true },
    where: filters.role ? { role: { name: filters.role } } : undefined
  });
  // Join and filter...
}
```

## ❌ BACKEND ACTION ITEMS (To-Do List)

### 🔴 HIGH PRIORITY (Blocking Admin Dashboard Core Features)

| ID  | Endpoint            | Description              | Suggested Implementation                                                                                                                                                      |
| --- | ------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.2 | `POST /staff`       | Create new staff member  | 1. Create user in Clerk via API<br>2. Create `UserRole` record with roleId<br>3. Optionally store additional staff metadata (cinema assignment) in a new `StaffProfile` table |
| 8.3 | `PATCH /staff/:id`  | Update staff information | 1. Update Clerk user fields (name, email)<br>2. Update `UserRole` if role changes<br>3. Update `StaffProfile` if exists                                                       |
| 8.4 | `DELETE /staff/:id` | Delete/Deactivate staff  | 1. Soft-delete: Set Clerk user to banned OR<br>2. Hard-delete: Remove from Clerk + delete `UserRole` records                                                                  |

**Architectural Note:** Consider adding a `staff_profiles` table to store:

```prisma
model StaffProfile {
  id        String   @id @default(cuid())
  userId    String   @unique  // Clerk user ID
  cinemaId  String?  @db.Uuid // Assigned cinema
  hireDate  DateTime
  status    StaffStatus @default(ACTIVE)
  // ... other staff-specific fields
}

enum StaffStatus {
  ACTIVE
  ON_LEAVE
  TERMINATED
}
```
---

## ✅ FRONTEND CHEATSHEET (Ready to Integrate)

> **These 34 endpoints are 100% ready for integration today.** Use the exact routes below.

### Movies Module

| ID  | Endpoint       | Route                                                   |
| --- | -------------- | ------------------------------------------------------- |
| 1.1 | Get movie list | `GET /api/v1/movies?page=1&limit=20&status=now_showing` |
| 1.2 | Create movie   | `POST /api/v1/movies`                                   |
| 1.3 | Update movie   | `PUT /api/v1/movies/:id`                                |
| 1.4 | Delete movie   | `DELETE /api/v1/movies/:id`                             |

### Genres Module

| ID  | Endpoint       | Route                       |
| --- | -------------- | --------------------------- |
| 2.1 | Get genre list | `GET /api/v1/genres`        |
| 2.2 | Create genre   | `POST /api/v1/genres`       |
| 2.3 | Update genre   | `PUT /api/v1/genres/:id`    |
| 2.4 | Delete genre   | `DELETE /api/v1/genres/:id` |

### Cinemas Module

| ID  | Endpoint        | Route                                                     |
| --- | --------------- | --------------------------------------------------------- |
| 3.1 | Get cinema list | `GET /api/v1/cinemas/filters` (pass empty params for all) |
| 3.2 | Create cinema   | `POST /api/v1/cinemas/cinema`                             |
| 3.3 | Update cinema   | `PATCH /api/v1/cinemas/cinema/:cinemaId`                  |
| 3.4 | Delete cinema   | `DELETE /api/v1/cinemas/cinema/:cinemaId`                 |

### Halls Module

| ID  | Endpoint                    | Route                                     |
| --- | --------------------------- | ----------------------------------------- |
| 4.2 | Get hall details + seat map | `GET /api/v1/halls/hall/:hallId`          |
| 4.3 | Create hall                 | `POST /api/v1/halls/hall`                 |
| 4.4 | Update hall                 | `PATCH /api/v1/halls/hall/:hallId`        |
| 4.5 | Delete hall                 | `DELETE /api/v1/halls/hall/:hallId`       |
| 4.6 | Update seat status          | `PATCH /api/v1/halls/seat/:seatId/status` |

### Showtimes Module

| ID  | Endpoint               | Route                                   |
| --- | ---------------------- | --------------------------------------- |
| 5.2 | Get halls for dropdown | `GET /api/v1/halls/cinema/:cinemaId`    |
| 5.3 | Create single showtime | `POST /api/v1/showtimes/showtime`       |
| 5.4 | Create batch showtimes | `POST /api/v1/showtimes/batch`          |
| 5.5 | Update showtime        | `PATCH /api/v1/showtimes/showtime/:id`  |
| 5.6 | Delete/Cancel showtime | `DELETE /api/v1/showtimes/showtime/:id` |
| 5.7 | Get seats for showtime | `GET /api/v1/showtimes/:id/seats`       |

### Movie Releases Module

| ID  | Endpoint              | Route                               |
| --- | --------------------- | ----------------------------------- |
| 6.1 | Get releases by movie | `GET /api/v1/movies/:id/releases`   |
| 6.2 | Create release        | `POST /api/v1/movie-releases`       |
| 6.3 | Update release        | `PUT /api/v1/movie-releases/:id`    |
| 6.4 | Delete release        | `DELETE /api/v1/movie-releases/:id` |

### Ticket Pricing Module

| ID  | Endpoint             | Route                                              |
| --- | -------------------- | -------------------------------------------------- |
| 7.1 | Get pricing for hall | `GET /api/v1/ticket-pricings/hall/:hallId`         |
| 7.2 | Update ticket price  | `PATCH /api/v1/ticket-pricings/pricing/:pricingId` |

### Reservations Module

| ID  | Endpoint                     | Route                                                                  |
| --- | ---------------------------- | ---------------------------------------------------------------------- |
| 9.1 | Get all reservations (admin) | `GET /api/v1/bookings/admin/all?status=CONFIRMED&startDate=2025-01-01` |
| 9.2 | Get reservation details      | `GET /api/v1/bookings/:id/summary`                                     |
| 9.3 | Update reservation status    | `PUT /api/v1/bookings/admin/:id/status`                                |

### Reports Module (Partial)

| ID   | Endpoint          | Route                                                                             |
| ---- | ----------------- | --------------------------------------------------------------------------------- |
| 10.1 | Revenue over time | `GET /api/v1/bookings/admin/revenue-report?startDate=xxx&endDate=xxx&groupBy=day` |
| 10.7 | Revenue trend     | Same as 10.1 - use `revenueByPeriod` array in response                            |

## 📎 Appendix: OpenAPI Update Checklist

The following endpoints need to be added to `/apps/api-gateway/doc/openapi.yml`:

- [ ] All Cinema endpoints (3.x)
- [ ] All Hall endpoints (4.x)
- [ ] All Showtime endpoints (5.x)
- [ ] Ticket Pricing endpoints (7.x)
- [ ] Staff endpoints (8.x) - once implemented
- [ ] Reservation/Booking admin endpoints (9.x)
- [ ] Report endpoints (10.x) - once implemented
- [ ] Review endpoints (11.x) - once implemented







📊 TỔNG HỢP API CHO ADMIN DASHBOARD
✅ CÁC MODULE CÓ ĐỦ API (100% sẵn sàng)
Module	Trang Admin	API Cần	Status
Movies	/admin/movies	GET/POST/PUT/DELETE /movies	✅ Đủ (ID 1.1-1.4)
Genres	/admin/genres	GET/POST/PUT/DELETE /genres	✅ Đủ (ID 2.1-2.4)
Cinemas	/admin/cinemas	GET/POST/PATCH/DELETE /cinemas	✅ Đủ (ID 3.1-3.4)
Halls	/admin/halls	GET/POST/PATCH/DELETE /halls	✅ Đủ (ID 4.2-4.5)
Seat Status	/admin/seat-status	PATCH /halls/seat/:seatId/status	✅ Đủ (ID 4.6)
Movie Releases	/admin/movie-releases	GET/POST/PUT/DELETE /movie-releases	✅ Đủ (ID 6.1-6.4)
Ticket Pricing	/admin/ticket-pricing	GET/PATCH /ticket-pricings	✅ Đủ (ID 7.1-7.2)
Batch Showtimes	/admin/batch-showtimes	POST /showtimes/batch	✅ Đủ (ID 5.4)
⚠️ CÁC MODULE CẦN WORKAROUND (API có nhưng route khác)
Module	Trang Admin	Vấn đề	Workaround
Halls List	/admin/halls	Không có GET /halls global	Cần gọi 2 bước: <br>1. GET /cinemas/filters → lấy tất cả cinemas <br>2. Loop gọi GET /halls/cinema/:cinemaId cho mỗi cinema
Showtimes	/admin/showtimes	Hiện tại: GET /cinemas/:cinemaId/movies/:movieId/showtimes/admin <br>Yêu cầu: Filter theo date/cinema/movie độc lập	Backend cần tạo: GET /api/v1/showtimes/admin?date=xxx&cinemaId=xxx&movieId=xxx (ID 5.1 trong Guide)
Showtime Seats	/admin/showtime-seats	Cần: GET /showtimes/:id/seats	✅ Có (ID 5.7) nhưng cần confirm response format
❌ CÁC MODULE THIẾU API (Backend cần bổ sung)
Module	Trang Admin	API Thiếu	Gợi ý từ Guide
Reports	/admin/reports	Cần 7 endpoints cho reports	Xem Section 10 trong Guide - chỉ có 10.1 và 10.7 (Revenue)
Settings	/admin/settings	Không có trong Guide	❌ Chưa có API - cần thiết kế mới
🔴 CHI TIẾT API THIẾU CHO MODULE REPORTS
Theo file API_ALIGNMENT_GUIDE.md, Reports module chỉ có:

ID	Có sẵn	Thiếu
10.1	✅ Revenue over time	-
10.2	❌	Revenue by cinema
10.3	❌	Revenue by movie
10.4	❌	Occupancy rate
10.5	❌	Ticket sales by seat type
10.6	❌	Peak hours analysis
10.7	✅ Revenue trend (same as 10.1)	-
Trang /admin/reports hiện cần:

Revenue by cinema performance
Movie performance (revenue + tickets + rating)
Genre breakdown
Hourly distribution
Customer segments
🔴 CHI TIẾT API THIẾU CHO MODULE SETTINGS
Trang /admin/settings cần các API sau nhưng KHÔNG CÓ trong Guide:

Setting Type	API Cần	Status
Profile	GET/PUT /admin/profile	❌ Thiếu
Notifications	GET/PUT /admin/notifications	❌ Thiếu
Security	GET/PUT /admin/security	❌ Thiếu
System	GET/PUT /admin/system-settings	❌ Thiếu
Billing	GET/PUT /admin/billing	❌ Thiếu
Appearance	GET/PUT /admin/appearance	❌ Thiếu
📋 TÓM TẮT
Tình trạng	Số module	Chi tiết
✅ Đủ API	8/12	Movies, Genres, Cinemas, Halls, Seat-Status, Movie-Releases, Ticket-Pricing, Batch-Showtimes
⚠️ Cần workaround	2/12	Halls (list all), Showtimes (flexible filter)
❌ Thiếu API	2/12	Reports (5 endpoints), Settings (6 endpoints)
🎯 KHUYẾN NGHỊ
Bắt đầu với 8 module đủ API - có thể integrate ngay
Yêu cầu Backend:
Tạo GET /api/v1/halls (optional cinemaId)
Tạo GET /api/v1/showtimes/admin với filters
Tạo 5 report endpoints (10.2-10.6)
Thiết kế Settings API (hoặc dùng Clerk cho user profile)