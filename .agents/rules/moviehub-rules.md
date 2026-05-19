---
trigger: always_on
---

# Movie Hub — Repository Rules

## 1. Stack & Monorepo

- **Monorepo**: Nx v21, package manager `npm`, Node 20, TypeScript ~5.9 (strict)
- **Backend**: NestJS 11, microservices via TCP (`Transport.TCP`)
- **Frontend**: Next.js 15 App Router (`apps/web`)
- **DB/ORM**: PostgreSQL + Prisma per service
- **Cache/WS**: Redis + Socket.io

```
apps/  api-gateway  booking-service  cinema-service  movie-service  user-service  web
libs/  shacdn-ui  shacdn-utils  shared-redis  shared-types
```

---

## 2. Service Ports

| Service | Port |
|---------|------|
| api-gateway | 3000 (HTTP) |
| user-service | 3001 TCP |
| movie-service | 3002 TCP |
| cinema-service | 3003 TCP |
| booking-service | 3004 TCP |

---

## 3. shared-types — Single Source of Truth

**Never duplicate** types/messages in individual apps. Always import from `@movie-hub/shared-types`.

```typescript
import { CreateBookingDto, BookingStatus } from '@movie-hub/shared-types';
import { PaginationQuery } from '@movie-hub/shared-types/common';
import { BookingMessage, CinemaMessage, UserMessage, PaymentMessage } from '@movie-hub/shared-types';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { AppRole, PermissionResource, PermissionAction, PermissionScope, PermissionRequirement } from '@movie-hub/shared-types';

// Server-side only — import directly, NOT via barrel:
import { LoggingInterceptor } from '@movie-hub/shared-types/common/logging.interceptor';
```

**`SERVICE_NAME`**: `USER` | `Movie` | `CINEMA` | `BOOKING`

**`AppRole`**: `ADMIN` | `CINEMA_MANAGER` | `STAFF` | `CUSTOMER`

**Message constants**: `UserMessage.*`, `MovieServiceMessage.*`, `CinemaMessage.*`, `BookingMessage.*`, `PaymentMessage.*`, `TicketMessage.*`, `LoyaltyMessage.*`, `RefundMessage.*`, `ConcessionMessage.*`, `PromotionMessage.*`

---

## 4. API Gateway

### Global setup (`main.ts`)
- Global prefix `/api`, URI versioning `/api/v1/...`
- Interceptors: `TransformInterceptor`, `LoggingInterceptor`
- Filter: `GlobalExceptionFilter`
- WS: `RedisIoAdapter` (Socket.io + Redis)
- Swagger: `/api/docs` from `apps/api-gateway/doc/openapi.yml`

### Response shape
```json
{ "success": true, "data": {}, "meta": {}, "timestamp": "", "path": "" }
{ "success": false, "message": "", "errors": [], "timestamp": "", "path": "" }
```

### Controller pattern
```typescript
@Controller({ version: '1', path: 'bookings' })
@SensitiveThrottle() // on payment/cancel/auth-sensitive endpoints
export class BookingController {
  @Post()
  @UseGuards(ClerkAuthGuard, RoleGuard)   // always this order
  @Roles(AppRole.CUSTOMER)
  @Permission({ resource: 'booking', action: 'manage', scope: 'own' })
  async create(@CurrentUserId() userId: string, @Body() dto: CreateBookingDto) {}
}
```

### AppRole (shared-types, `rbac/index.ts`)
`CUSTOMER` | `STAFF` | `CINEMA_MANAGER` | `ADMIN`

### Common decorators
| Decorator | File |
|-----------|------|
| `@CurrentUserId()` | `common/decorator/current-user-id.decorator` |
| `@Roles(...)` | `common/decorator/roles.decorator` |
| `@Permission({...})` | `common/decorator/permission.decorator` |
| `@SensitiveThrottle()` | `common/decorator/sensitive-throttle.decorator` |

### Throttle tiers
| Name | TTL | Limit | Block |
|------|-----|-------|-------|
| `default` | 60s | 120 | — |
| `sensitiveBurst` | 10s | 30 | 30s |
| `sensitiveSustained` | 60s | 80 | 120s |

### Validation
- Global: `ZodValidationPipe` (via `nestjs-zod`) — **do NOT use `class-validator`**
- All DTOs defined in `libs/shared-types`

---

## 5. Microservice Pattern

### bootstrap (`main.ts` of each service)
```typescript
app.connectMicroservice<MicroserviceOptions>({ transport: Transport.TCP, options: { host: '0.0.0.0', port: config.get<number>('TCP_PORT') } });
app.useGlobalFilters(new AllExceptionsFilter());
await app.startAllMicroservices();
```

### Controller handler
```typescript
@Controller()
export class BookingController {
  @MessagePattern(BookingMessage.CREATE)
  async create(@Payload() data: CreateBookingPayload) {
    return this.bookingService.create(data);
  }
}
```

### Module structure
```
app.module.ts        # ConfigModule (Joi validation) + CacheModule + domain modules
prisma.service.ts    # Single PrismaService — never instantiate PrismaClient directly
<domain>/
  <domain>.module.ts
  <domain>.service.ts   # business logic here
  <domain>.controller.ts  # @MessagePattern handlers only — thin layer
```

### Prisma rules
- UUID: `@default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- Money: `Decimal @db.Decimal(10, 2)` — **never `Float`**
- Timestamps: `@db.Timestamp(6)`
- Always add `@@index` for FK fields and frequently filtered fields
- Generated client at `../generated/prisma` per service

### Config validation
Every service must validate env vars with Joi in `ConfigModule.forRoot`. Never use `process.env` directly in application code.

---

## 6. Domain Map

### booking-service
`booking` | `payment` | `refund` | `ticket` | `concession` | `promotion` | `loyalty` | `notification` | `redis`

### cinema-service
`cinema` | `cinema-location` | `hall` | `showtime` | `ticket-pricing` | `realtime`

### movie-service
`movie` | `genre` | `review`

### user-service
`user` | `staff` | `rbac` | `config`

### api-gateway modules
`user` | `movie` | `cinema` | `booking` (includes payment, refund, ticket, concession, promotion, loyalty) | `realtime` | `dashboard`

---

## 7. Frontend (`apps/web`)

### Key config
- Next.js 15, `output: 'standalone'` — **do not change**
- Wrapped with `@nx/next` (`withNx`) in `next.config.js`
- NestJS packages (`@nestjs/*`, `nestjs-zod`, `class-transformer`) are stubbed via webpack alias — **never import these in web**

### Auth (Clerk)
- `ClerkProvider` in `layout.tsx`, primary color `#E11D48`
- After sign-out → `/admin/login`
- Middleware: passthrough (`NextResponse.next()`) — Clerk middleware is commented out

### Directory
```
src/
  app/(main)/         # public routes (movies, booking flow)
  app/admin/          # admin dashboard
  app/api/            # Next.js API routes (webhooks)
  components/ui/      # Shadcn components (from libs/shacdn-ui)
  components/providers/  # QueryClientProvider, PageWrapper
  features/shared/api/   # axios API client functions → /api/v1/...
  features/shared/actions/  # Next.js Server Actions
  features/admin/     # admin feature pages
  hooks/              # custom React hooks
  stores/             # Zustand: booking-store.ts, trailer-modal-store.ts
```

### State
- **Server state**: TanStack Query (`@tanstack/react-query`)
- **Client state**: Zustand

### UI library
- Shadcn UI (`@movie-hub/shacdn-ui`), Lucide icons, Framer Motion, Sonner toasts
- Forms: React Hook Form + Zod (`@hookform/resolvers/zod`)
- Charts: Recharts | Carousel: Embla / Swiper | Date: React Day Picker
- Font: `Inter` from `next/font/google`

### API calls
All client → `api-gateway` at `/api/v1/...`. **Never call microservice TCP ports from frontend.**

---

## 8. Nx Commands

```bash
# Serve
npm run dev:core          # api-gateway + cinema-service + movie-service
npm run dev:all           # all services
npm run dev:web           # Next.js only

# Generate
nx g @nx/nest:module <name> --project=<service>
nx g @nx/nest:service <name> --project=<service>
nx g @nx/nest:controller <name> --project=<service>

# Test
npm run test:unit         # all unit tests (excludes e2e)
npm run test:integration  # all e2e tests
nx test <project>

# Database
npm run prisma:generate   # regenerate all Prisma clients

# Docker
npm run docker:up:infra   # Redis + all Postgres DBs
npm run docker:up         # all services
npm run docker:clean      # down + remove volumes
```

---

## 9. Code Style

- **No `any`** — use `unknown` when type is uncertain
- **No `class-validator`** decorators in backend — Zod only
- **No `process.env`** directly — inject `ConfigService`
- Use `'use client'` only when needed; default to Server Components in Next.js
- Controllers are thin — all logic goes in services
- One module per bounded context

### Naming
| Entity | Convention |
|--------|-----------|
| Files | `kebab-case` |
| Classes / Interfaces / Types / Enums | `PascalCase` |
| Enum values / Constants | `UPPER_SNAKE_CASE` |
| Variables / Functions | `camelCase` |
| React components | `PascalCase` |

---

## 10. Do's & Don'ts

### ✅ Do
- Import all shared types and message patterns from `@movie-hub/shared-types`
- Always compose guards: `@UseGuards(ClerkAuthGuard, RoleGuard)` in that order
- Apply `@SensitiveThrottle()` to payment, cancellation, auth-sensitive endpoints
- Add `@@index` for FK fields and filtered fields in Prisma
- Validate all env vars with Joi in `ConfigModule.forRoot`
- Define new DTOs as Zod schemas in `libs/shared-types`

### ❌ Don't
- Don't use `class-validator` / `class-transformer` decorators
- Don't call microservice TCP ports from the frontend
- Don't import `@nestjs/*` packages in `apps/web`
- Don't put business logic in controllers
- Don't create a new `PrismaClient` instance — inject `PrismaService`
- Don't use `Float` for monetary fields — use `Decimal @db.Decimal(10, 2)`
- Don't hardcode service host/port — read from `ConfigService`
- Don't bypass `api-gateway` for client → backend communication

---

## 11. Antigravity AI Workflow

When executing tasks in this repository, the Antigravity AI MUST adhere to the following strict workflow:

### 1. Pre-computation & Discovery
- **Check Shared Resources:** Before generating new types, enums, or DTOs, always use `grep_search` to check if an equivalent exists in `libs/shared-types`.
- **Analyze Usage:** If modifying a microservice handler, find all usages in the `api-gateway` to ensure contracts are not broken.

### 2. Implementation
- **Minimal Diffs:** When editing code, only modify the necessary logic. Do not reformat unrelated code unless requested.
- **No Assumptions:** If a Prisma schema modification is needed, prompt the user before running `prisma migrate` or `prisma generate`. 

### 3. Verification (Self-Correction)
- **Automatic Linting/Testing:** After completing a feature or fix in a backend service, automatically run the terminal command `npx nx lint <service_name>` or `npx nx test <service_name>` to verify code compiles. Do not ask for permission for read-only tests.
- **Check Errors:** If tests or TypeScript compiler (`npx tsc --noEmit`) fails, read the output and fix the errors silently before presenting the final result to the user.

### 4. Version Control
- **Conventional Commits:** When asked to commit, ALWAYS use standard conventional commits matching the Nx app structure (e.g., `feat(booking-service): add payment retry logic`, `fix(web): resolve hydration mismatch`).
