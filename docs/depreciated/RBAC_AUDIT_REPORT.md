# RBAC Security Audit Report

**Audit Date:** 2026-01-06  
**Auditor:** Gemini Code Agent  
**Scope:** Cinema Manager vs Super Admin Role-Based Access Control

---

## Executive Summary

This audit examined the Role-Based Access Control (RBAC) implementation across the full stack—from database schema to frontend UI—focusing on the distinction between **Cinema Manager** and **Super Admin** roles.

| Layer                             | Risk Level  | Issues Found           |
| --------------------------------- | ----------- | ---------------------- |
| **Truth Layer** (Schema/Clerk)    | 🟡 Medium   | 1 structural concern   |
| **Enforcement Layer** (API)       | 🔴 Critical | 7 vulnerable endpoints |
| **Presentation Layer** (Frontend) | 🟡 Medium   | 2 UX gaps              |

---

## Layer 1: The Truth Layer (Schema & Clerk)

### 1.1 Database Schema Analysis

**Location:** `apps/user-service/prisma/schema.prisma`

```prisma
model Staff {
  id       String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cinemaId String @db.Uuid  // ⚠️ REQUIRED FIELD - No @relation

  fullName  String        @map("full_name")
  email     String        @unique
  position  StaffPosition @default(TICKET_CLERK)
  // ...
}

enum StaffPosition {
  CINEMA_MANAGER
  ASSISTANT_MANAGER
  TICKET_CLERK
  // ...
}
```

### 1.2 Audit Findings

#### ✅ GOOD: Staff-Cinema Link

- The `cinemaId` field is **required** (`String` without `?`), preventing orphaned managers.
- Every staff member MUST have a `cinemaId`.

#### ⚠️ ISSUE: No Foreign Key Constraint

| Finding                                           | Severity  | Status   |
| ------------------------------------------------- | --------- | -------- |
| `cinemaId` has no `@relation` to a `Cinema` model | 🟡 Medium | **Open** |

**Details:** The `cinemaId` field lacks a foreign key constraint because the `Cinema` table exists in a separate microservice (`cinema-service`). While this is an architectural choice for microservices, it means:

1. **Orphaned State Is Possible**: A Staff record could reference a `cinemaId` that has been deleted in the cinema-service.
2. **No Referential Integrity**: The database cannot prevent invalid `cinemaId` values.

### 1.3 Clerk Metadata Sync

**Location:** `apps/api-gateway/src/app/module/user/service/staff.service.ts`

```typescript
// Lines 68-72: On Staff Creation
publicMetadata: {
  role: dto.position,      // e.g., "CINEMA_MANAGER"
  cinemaId: dto.cinemaId,  // Synced to Clerk
}
```

#### ✅ GOOD: Metadata Synced Correctly

- Role and cinemaId are synced to Clerk's `publicMetadata` on creation/update.
- The backend guard re-verifies against the database (doesn't trust stale metadata).

#### ⚠️ ISSUE: Super Admin Has No Explicit Definition

| Finding                                      | Severity  | Status   |
| -------------------------------------------- | --------- | -------- |
| "Super Admin" role is implicit, not explicit | 🟡 Medium | **Open** |

**Details:** The system determines Super Admin status by the **absence** of a `cinemaId` on the Staff record. This is validated in `ClerkAuthGuard` (line 78-83):

```typescript
request.staffContext = {
  staffId: staffResult.data.id,
  cinemaId: staffResult.data.cinemaId, // null = Super Admin
  role: staffResult.data.position,
};
```

**Risk:** If a staff member's cinemaId is accidentally NULL (data corruption), they would gain Super Admin privileges.

---

## Layer 2: The Enforcement Layer (Server Actions / API)

### 2.1 Overview of RBAC Enforcement Pattern

The system uses a **post-authentication authorization pattern**:

1. `ClerkAuthGuard` authenticates the user and attaches `staffContext` to the request.
2. Each controller manually checks `req.staffContext?.cinemaId` to enforce scoping.

### 2.2 Correctly Protected Endpoints ✅

| Controller            | Endpoint                             | RBAC Enforcement                          |
| --------------------- | ------------------------------------ | ----------------------------------------- |
| `CinemaController`    | `POST /cinemas/cinema`               | ✅ Managers blocked                       |
| `CinemaController`    | `DELETE /cinemas/cinema/:id`         | ✅ Managers blocked                       |
| `CinemaController`    | `PATCH /cinemas/cinema/:id`          | ✅ Scoped to own cinema                   |
| `CinemaController`    | `GET /cinemas`                       | ✅ Filtered to own cinema                 |
| `MovieController`     | `POST /movies`                       | ✅ Managers blocked                       |
| `MovieController`     | `PUT /movies/:id`                    | ✅ Managers blocked                       |
| `MovieController`     | `DELETE /movies/:id`                 | ✅ Managers blocked                       |
| `ShowtimeController`  | `POST /showtimes/showtime`           | ✅ Scoped to own cinema                   |
| `ShowtimeController`  | `POST /showtimes/batch`              | ✅ Scoped to own cinema                   |
| `ShowtimeController`  | `GET /showtimes`                     | ✅ Scoped to own cinema                   |
| `HallController`      | `GET /halls/cinema/:cinemaId`        | ✅ Scoped, throws 403                     |
| `HallController`      | `POST /halls/hall`                   | ✅ Scoped to own cinema                   |
| `StaffController`     | `POST /staffs`                       | ✅ Scoped to own cinema                   |
| `StaffController`     | `GET /staffs`                        | ✅ Scoped to own cinema                   |
| `BookingController`   | `GET /bookings/admin/all`            | ✅ Scoped to own cinema                   |
| `BookingController`   | `GET /bookings/admin/statistics`     | ✅ Scoped                                 |
| `BookingController`   | `GET /bookings/admin/revenue-report` | ✅ Scoped                                 |
| `DashboardController` | All endpoints                        | ✅ Uses `staffContext?.cinemaId` fallback |

### 2.3 🔴 CRITICAL: Unprotected Endpoints (No Auth/RBAC)

| Controller                | Endpoint                             | Issue               | Severity    |
| ------------------------- | ------------------------------------ | ------------------- | ----------- |
| `MovieReleaseController`  | `POST /movie-releases`               | **No `@UseGuards`** | 🔴 Critical |
| `MovieReleaseController`  | `PUT /movie-releases/:id`            | **No `@UseGuards`** | 🔴 Critical |
| `MovieReleaseController`  | `DELETE /movie-releases/:id`         | **No `@UseGuards`** | 🔴 Critical |
| `GenreController`         | `POST /genres`                       | **No `@UseGuards`** | 🔴 Critical |
| `GenreController`         | `PUT /genres/:id`                    | **No `@UseGuards`** | 🔴 Critical |
| `GenreController`         | `DELETE /genres/:id`                 | **No `@UseGuards`** | 🔴 Critical |
| `ReviewController`        | `DELETE /reviews/:id`                | **No `@UseGuards`** | 🔴 Critical |
| `TicketPricingController` | `PATCH /ticket-pricings/pricing/:id` | **No `@UseGuards`** | 🔴 Critical |

**Impact:** Anonymous users can:

- Create/update/delete movie releases
- Create/update/delete genres
- Delete any review
- Modify ticket pricing

### 2.4 🔴 CRITICAL: Missing Cinema Ownership Verification ("Blind Spots")

These endpoints ARE authenticated but trust client-provided IDs without verifying ownership:

| Controller             | Endpoint                                   | Issue                          | Severity    |
| ---------------------- | ------------------------------------------ | ------------------------------ | ----------- |
| `ShowtimeController`   | `PATCH /showtimes/showtime/:id`            | No ownership check             | 🔴 Critical |
| `ShowtimeController`   | `DELETE /showtimes/showtime/:id`           | No ownership check             | 🔴 Critical |
| `HallController`       | `PATCH /halls/hall/:hallId`                | No ownership check             | 🔴 Critical |
| `HallController`       | `DELETE /halls/hall/:hallId`               | No ownership check             | 🔴 Critical |
| `HallController`       | `PATCH /halls/seat/:seatId/status`         | No ownership check             | 🔴 Critical |
| `StaffController`      | `PUT /staffs/:id`                          | No ownership check             | 🟡 Medium   |
| `StaffController`      | `DELETE /staffs/:id`                       | No ownership check             | 🟡 Medium   |
| `StaffController`      | `GET /staffs/:id`                          | No auth guard                  | 🟡 Medium   |
| `BookingController`    | `PUT /bookings/admin/:id/status`           | No cinema check                | 🟡 Medium   |
| `BookingController`    | `POST /bookings/admin/:id/confirm`         | No cinema check                | 🟡 Medium   |
| `BookingController`    | `GET /bookings/admin/showtime/:showtimeId` | No cinema check                | 🟡 Medium   |
| `ConcessionController` | `POST /concessions`                        | No RBAC (any staff can create) | 🟡 Medium   |
| `ConcessionController` | `PUT /concessions/:id`                     | No RBAC (any staff can update) | 🟡 Medium   |
| `ConcessionController` | `DELETE /concessions/:id`                  | No RBAC (any staff can delete) | 🟡 Medium   |

**Attack Scenario (Showtime):**

1. Manager A (Cinema X) logs in.
2. Manager A calls `DELETE /showtimes/showtime/{showtimeIdFromCinemaY}`.
3. The system deletes Cinema Y's showtime because it never verified `req.staffContext?.cinemaId` against the showtime's `cinemaId`.

**Attack Scenario (Hall):**

1. Manager A identifies Hall ID from Cinema Y (via UI or enumeration).
2. Manager A calls `PATCH /halls/hall/{hallIdFromCinemaY}` with malicious data.
3. Hall from Cinema Y is modified.

---

## Layer 3: The Presentation Layer (Frontend)

### 3.1 Admin Layout Analysis

**Location:** `apps/web/src/app/admin/layout.tsx`

#### ⚠️ ISSUE: No Role-Based Menu Filtering

| Finding                                | Severity  | Status   |
| -------------------------------------- | --------- | -------- |
| Menu items are identical for all roles | 🟡 Medium | **Open** |

The sidebar menu (lines 35-163) shows ALL navigation items regardless of role. Managers can see and navigate to routes like `/admin/cinemas` even though they have limited permissions.

### 3.2 Page-Level Conditional Rendering

**Location:** `apps/web/src/app/admin/cinemas/page.tsx` (lines 67-68, 300-311, 390-401)

```tsx
const userRole = user?.publicMetadata?.role as string;
const isManager = userRole === 'CINEMA_MANAGER';

// Hides "Add Cinema" button for managers
{!isManager && (
  <Button ...>
    <Plus /> Thêm Rạp
  </Button>
)}

// Hides "Delete" menu item for managers
{!isManager && (
  <DropdownMenuItem onClick={() => { ... }}>
    <Trash2 /> Xóa
  </DropdownMenuItem>
)}
```

#### ✅ GOOD: Buttons Hidden Correctly

The "Add Cinema" and "Delete Cinema" buttons are conditionally hidden for managers.

**Location:** `apps/web/src/app/admin/movies/page.tsx` (lines 77-79, 641-652)

The "Add Movie" button is also correctly hidden for managers.

### 3.3 Missing Protections

| Issue                   | Details                                                                                                                                                  | Severity                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **No Route Guards**     | If a manager navigates to `/admin/movies` and the "Add Movie" button is hidden, they can still access the create dialog via URL manipulation or devtools | 🟡 Medium                     |
| **No 403 Page**         | There is no explicit 403 Forbidden page. If a manager manually hits a forbidden API, they get a raw error response.                                      | 🟢 Low                        |
| **Stale Metadata Risk** | Frontend relies on `user.publicMetadata.role` which could be stale                                                                                       | 🟢 Low (mitigated by backend) |

### 3.4 RequireAdminClerkAuth Analysis

**Location:** `apps/web/src/components/require-admin-clerk-auth.tsx`

```tsx
export const RequireAdminClerkAuth = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  return <>{children}</>; // ⚠️ No role check!
};
```

#### ⚠️ ISSUE: No Staff Role Verification

The `RequireAdminClerkAuth` component only checks if the user is **signed in**, not if they have a valid staff role. A regular customer who signs in could access `/admin` routes.

**Current Risk:** The backend would reject their requests (no `staffContext`), but they could see admin UI elements and receive confusing errors.

---

## Vulnerability Summary

### Critical (Immediate Remediation Required)

| ID    | Vulnerability                                    | Affected Endpoints                     |
| ----- | ------------------------------------------------ | -------------------------------------- |
| V-001 | **No Authentication** on Movie Release CRUD      | `POST/PUT/DELETE /movie-releases/*`    |
| V-002 | **No Authentication** on Genre CRUD              | `POST/PUT/DELETE /genres/*`            |
| V-003 | **No Authentication** on Review Delete           | `DELETE /reviews/:id`                  |
| V-004 | **No Authentication** on Ticket Pricing Update   | `PATCH /ticket-pricings/pricing/:id`   |
| V-005 | **No Ownership Check** on Showtime Update/Delete | `PATCH/DELETE /showtimes/showtime/:id` |
| V-006 | **No Ownership Check** on Hall Update/Delete     | `PATCH/DELETE /halls/hall/:id`         |
| V-007 | **No Ownership Check** on Seat Status Update     | `PATCH /halls/seat/:seatId/status`     |

### Medium (Short-Term Fix)

| ID    | Vulnerability                                 | Location                         |
| ----- | --------------------------------------------- | -------------------------------- |
| V-008 | **No Ownership Check** on Staff Update/Delete | `PUT/DELETE /staffs/:id`         |
| V-009 | **No Cinema Scope** on Admin Booking Actions  | `PUT/POST /bookings/admin/:id/*` |
| V-010 | **No RBAC** on Concession Management          | `POST/PUT/DELETE /concessions/*` |
| V-011 | **Implicit Super Admin** via null cinemaId    | Schema design                    |
| V-012 | **No Role Check** in RequireAdminClerkAuth    | Frontend component               |

### Low (Best Practice)

| ID    | Vulnerability                             | Location      |
| ----- | ----------------------------------------- | ------------- |
| V-013 | No 403 Forbidden page for blocked actions | Frontend      |
| V-014 | Menu items visible regardless of role     | Admin layout  |
| V-015 | Orphaned Cinema ID possible (no FK)       | Schema design |

---

## Fix List (Prioritized Remediation)

### 🔴 Priority 1: Critical - Add Authentication Guards (Estimated: 1 hour)

**File:** `apps/api-gateway/src/app/module/movie/controller/movie-release.controller.ts`

```typescript
import { UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';

@Controller({ version: '1', path: 'movie-releases' })
export class MovieReleaseController {
  @Post()
  @UseGuards(ClerkAuthGuard)
  async createMovieRelease(@Req() req: any, @Body() request: CreateMovieReleaseRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot create movie releases');
    }
    return this.movieService.createMovieRelease(request);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async updateMovieRelease(@Req() req: any, @Param('id') id: string, @Body() request: CreateMovieReleaseRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot update movie releases');
    }
    return this.movieService.updateMovieRelease(id, request);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot delete movie releases');
    }
    await this.movieService.deleteMovieRelease(id);
    return null;
  }
}
```

**Apply similar pattern to:** `GenreController`, `ReviewController`, `TicketPricingController`

---

### 🔴 Priority 2: Critical - Add Ownership Verification (Estimated: 2 hours)

**File:** `apps/api-gateway/src/app/module/cinema/controller/showtime.controller.ts`

```typescript
@Patch('/showtime/:id')
@UseGuards(ClerkAuthGuard)
async updateShowtime(
  @Req() req: any,
  @Param('id') showtimeId: string,
  @Body() updateData: UpdateShowtimeRequest
) {
  const userCinemaId = req.staffContext?.cinemaId;
  if (userCinemaId) {
    // Fetch showtime to verify ownership
    const showtime = await this.showtimeService.getShowtime(showtimeId);
    if (showtime?.data?.cinemaId !== userCinemaId) {
      throw new ForbiddenException('You can only update showtimes for your own cinema');
    }
  }
  return this.showtimeService.updateShowtime(showtimeId, updateData);
}

@Delete('/showtime/:id')
@UseGuards(ClerkAuthGuard)
async deleteShowtime(@Req() req: any, @Param('id') showtimeId: string) {
  const userCinemaId = req.staffContext?.cinemaId;
  if (userCinemaId) {
    const showtime = await this.showtimeService.getShowtime(showtimeId);
    if (showtime?.data?.cinemaId !== userCinemaId) {
      throw new ForbiddenException('You can only delete showtimes for your own cinema');
    }
  }
  return this.showtimeService.deleteShowtime(showtimeId);
}
```

**Apply similar pattern to:** `HallController.updateHall`, `HallController.deleteHall`, `HallController.updateSeatStatus`

---

### 🟡 Priority 3: Medium - Fix Staff Controller (Estimated: 30 min)

**File:** `apps/api-gateway/src/app/module/user/controller/staff.controller.ts`

```typescript
@Get(':id')
@UseGuards(ClerkAuthGuard)  // Add guard
async findOne(@Req() req: any, @Param('id') id: string) {
  const userCinemaId = req.staffContext?.cinemaId;
  const staff = await this.staffService.findOne(id);
  if (userCinemaId && staff?.data?.cinemaId !== userCinemaId) {
    throw new ForbiddenException('You can only view staff from your own cinema');
  }
  return staff;
}

@Put(':id')
@UseGuards(ClerkAuthGuard)
async update(@Req() req: any, @Param('id') id: string, @Body() request: UpdateStaffRequest) {
  const userCinemaId = req.staffContext?.cinemaId;
  if (userCinemaId) {
    const staff = await this.staffService.findOne(id);
    if (staff?.data?.cinemaId !== userCinemaId) {
      throw new ForbiddenException('You can only update staff from your own cinema');
    }
  }
  return this.staffService.update(id, request);
}

@Delete(':id')
@UseGuards(ClerkAuthGuard)
async remove(@Req() req: any, @Param('id') id: string) {
  const userCinemaId = req.staffContext?.cinemaId;
  if (userCinemaId) {
    const staff = await this.staffService.findOne(id);
    if (staff?.data?.cinemaId !== userCinemaId) {
      throw new ForbiddenException('You can only delete staff from your own cinema');
    }
  }
  return this.staffService.remove(id);
}
```

---

### 🟡 Priority 4: Medium - Enhance Frontend Auth Guard (Estimated: 30 min)

**File:** `apps/web/src/components/require-admin-clerk-auth.tsx`

```tsx
export const RequireAdminClerkAuth = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isLoaded, isSignedIn, router, pathname]);

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  // ✅ ADD: Verify user has a staff role
  const userRole = user?.publicMetadata?.role as string | undefined;
  const isCinemaStaff = ['CINEMA_MANAGER', 'ASSISTANT_MANAGER', 'TICKET_CLERK', 'CONCESSION_STAFF', 'USHER', 'PROJECTIONIST', 'CLEANER', 'SECURITY'].includes(userRole || '');

  if (!isCinemaStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to access the admin panel.</p>
        <Button onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  return <>{children}</>;
};
```

---

### 🟢 Priority 5: Low - Add Role-Based Menu Filtering (Estimated: 1 hour)

**File:** `apps/web/src/app/admin/layout.tsx`

```tsx
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string;
  const isManager = userRole === 'CINEMA_MANAGER';

  // Filter menu sections based on role
  const filteredMenuSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Hide global management items from managers
        if (isManager) {
          const adminOnlyRoutes = ['/admin/genres']; // Add routes as needed
          return !adminOnlyRoutes.includes(item.href);
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Use filteredMenuSections in rendering...
}
```

---

## Testing Recommendations

After implementing fixes, perform the following tests:

### Authentication Tests

1. ❌ Unauthenticated request to `POST /movie-releases` → Should return 401
2. ❌ Unauthenticated request to `DELETE /reviews/:id` → Should return 401
3. ❌ Unauthenticated request to `PATCH /ticket-pricings/pricing/:id` → Should return 401

### Authorization Tests (as Cinema Manager)

4. ❌ `PATCH /showtimes/showtime/{otherCinemaShowtimeId}` → Should return 403
5. ❌ `DELETE /halls/hall/{otherCinemaHallId}` → Should return 403
6. ❌ `PUT /staffs/{otherCinemaStaffId}` → Should return 403
7. ❌ `POST /movies` → Should return 403
8. ❌ `POST /genres` → Should return 403

### Authorization Tests (as Super Admin)

9. ✅ `POST /movies` → Should succeed
10. ✅ `POST /cinemas/cinema` → Should succeed
11. ✅ `DELETE /showtimes/showtime/{anyId}` → Should succeed

---

## Conclusion

The RBAC system has a solid foundation with the `ClerkAuthGuard` and `staffContext` pattern. However, **several critical endpoints lack both authentication and authorization checks**, creating significant security vulnerabilities.

**Immediate action is required** on V-001 through V-007 to prevent unauthorized access and cross-cinema data manipulation.

The frontend RBAC is correctly implemented for UI hiding but lacks proactive route protection for edge cases.
