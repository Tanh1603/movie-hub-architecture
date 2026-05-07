# User Service Integration Tests

This directory contains integration tests for the `user-service` microservice.

## Test Architecture

### Key Principles

1. **Database**: Uses **REAL PostgreSQL** - tests run against the actual database
2. **External Services**: **MOCKED**
   - `clerkClient` (Clerk SDK) - identity management
   - `CACHE_MANAGER` - Redis cache (for cache hit/miss testing)
3. **Protocol Adaptation**: Since this is a TCP microservice (`@MessagePattern`), we **inject controllers directly**

### Test Structure

```
test/integration/user-service/
├── helpers/
│   └── user-test-helpers.ts     # Test utilities, mocks, factories
├── 1.user-module.spec.ts        # User, Permissions, Settings
├── 2.staff-module.spec.ts       # Staff CRUD with extensive filtering
└── README.md                    # This file
```

## Running the Tests

### Prerequisites

1. Docker must be running with the PostgreSQL database
2. The `user-service` database must be migrated

```bash
# Start the database
docker-compose up -d postgres

# Run migrations (if needed)
npx nx run user-service:prisma-migrate
```

### Run All User Service Tests

```bash
# Run all integration tests for user-service
npx jest --config=apps/user-service/jest.config.ts test/integration/user-service
```

### Run Specific Test Files

```bash
# Run only User Module tests (including cache tests)
npx jest test/integration/user-service/1.user-module.spec.ts

# Run only Staff Module tests
npx jest test/integration/user-service/2.staff-module.spec.ts
```

### Run with Verbose Output

```bash
npx jest --config=apps/user-service/jest.config.ts test/integration/user-service --verbose
```

## Test Coverage Reference

### 1. User Module (`1.user-module.spec.ts`)

| Operation               | Test Scenarios                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `getPermissions`        | ✅ **Cache Miss** (DB query + cache set), ✅ **Cache Hit** (no DB call), ✅ Empty roles, ✅ Multiple roles |
| `getUser`               | ✅ Returns Clerk data                                                                                      |
| `getUserDetail`         | ✅ Valid user, ❌ Not found (Clerk error)                                                                  |
| `findSettingVariables`  | ✅ All settings, ✅ With description                                                                       |
| `updateSettingVariable` | ✅ Update value, ✅ Update description, ❌ Not found                                                       |

### 2. Staff Module (`2.staff-module.spec.ts`)

| Operation      | Test Scenarios                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createStaff`  | ✅ All fields, ✅ Positions, ✅ Work types, ✅ Shift types, ❌ Duplicate email                                                                                                                                      |
| `findAllStaff` | ✅ Pagination, ✅ Filter by cinemaId, ✅ Filter by gender, ✅ Filter by position, ✅ Filter by status, ✅ Filter by workType, ✅ Filter by shiftType, ✅ Search by fullName (partial), ✅ Multiple filters combined |
| `findOneStaff` | ✅ By ID, ✅ Not found (null)                                                                                                                                                                                       |
| `updateStaff`  | ✅ Single field, ✅ Multiple fields, ❌ Not found                                                                                                                                                                   |
| `removeStaff`  | ✅ Delete success, ❌ Not found                                                                                                                                                                                     |

## Key Test Focus Areas

### ⚠️ Cache Hit/Miss for getPermissions

The `getPermissions` method has a cache-first strategy:

```typescript
// Cache Miss Flow:
1. Check cache → empty
2. Query database for permissions
3. Set cache with result
4. Return permissions

// Cache Hit Flow:
1. Check cache → has data
2. Return cached data (DB NOT called)
```

Tests verify both scenarios:

```typescript
it('should return permissions from cache on cache hit (no DB call)', async () => {
  // Pre-populate cache
  mockCacheManager.get.mockResolvedValueOnce(['CACHED_PERMISSION']);

  const result = await getPermissions({ userId: 'test-user' });

  expect(result).toEqual(['CACHED_PERMISSION']);
  expect(mockCacheManager.set).not.toHaveBeenCalled(); // Cache NOT updated
});
```

### ⚠️ Clerk API Mocking

The service calls external Clerk API for user management:

```typescript
// Mock Clerk responses
const mockClerkClient = {
  users: {
    getUserList: jest.fn().mockResolvedValue({ data: [...] }),
    getUser: jest.fn().mockImplementation((userId) => {
      if (userId === 'user_not_found') throw new Error('Not found');
      return Promise.resolve({ id: userId, ... });
    }),
  },
};
```

This ensures:

- Tests are deterministic (no external API calls)
- Error cases can be simulated
- No Clerk API rate limits affect tests

### ⚠️ Staff Email Unique Constraint

The `Staff` table has a unique constraint on `email`:

```typescript
it('should fail when creating staff with duplicate email', async () => {
  await createStaff({ email: 'same@test.com' }); // First - OK
  await expect(
    createStaff({ email: 'same@test.com' }) // Second - P2002!
  ).rejects.toMatchObject({ code: 'P2002' });
});
```

## Mocked Dependencies

### Clerk Client (External API)

```typescript
const mockClerkClient = {
  users: {
    getUserList: jest.fn().mockResolvedValue({ data: [...] }),
    getUser: jest.fn().mockImplementation((userId) => Promise.resolve({...})),
  },
};
```

### Cache Manager (Redis)

```typescript
const mockCacheManager = {
  get: jest.fn(), // Returns cached value or undefined
  set: jest.fn(), // Stores value in cache
  del: jest.fn(), // Removes from cache
  reset: jest.fn(), // Clears all cache
};
```

The mock includes internal storage for testing cache state:

```typescript
// Access cache for assertions
expect(mockCacheManager._getCache().get('permissions:user-1')).toBeDefined();

// Clear cache between tests
mockCacheManager._clearCache();
```

## Database Schema Relationships

```
Permission (id, name)
   ↑
RolePermission (roleId, permissionId)
   ↓
Role (id, name)
   ↑
UserRole (userId, roleId)  → Links to external Clerk userId

Staff (id, cinemaId, fullName, email*, ...)  *unique

Setting (key*, value, description)  *unique primary key
```

## Cleanup Strategy

Each test file follows this pattern:

```typescript
beforeAll(async () => {
  ctx = await createUserTestingModule();
}, 60000);

afterAll(async () => {
  await cleanupUserTestData(ctx.prisma);
  await closeUserTestContext(ctx);
}, 30000);

beforeEach(async () => {
  await cleanupRolesAndPermissions(ctx.prisma);
  ctx.mockCacheManager._clearCache();
  ctx.mockCacheManager.get.mockClear();
  ctx.mockCacheManager.set.mockClear();
});
```

## Troubleshooting

### Jest Hangs After Tests

Ensure `closeUserTestContext()` is called in `afterAll`:

```typescript
await ctx.prisma.$disconnect();
await ctx.app.close();
```

### Cache Related Failures

Ensure cache mocks are cleared in `beforeEach`:

```typescript
ctx.mockCacheManager._clearCache();
ctx.mockCacheManager.get.mockClear();
ctx.mockCacheManager.set.mockClear();
```

### Clerk Mock Not Applied

The clerkClient is imported at module load time. If mocking isn't working:

1. Ensure jest.mock is called before imports
2. Consider using module factory pattern

### Database Connection Issues

Check environment variables:

- `DATABASE_URL` should point to the user database

## Reference Documentation

For detailed business logic and test scenarios, see:

- [USER_SERVICE_INTEGRATION_TEST_DOCS.md](../../docs/USER_SERVICE_INTEGRATION_TEST_DOCS.md)
