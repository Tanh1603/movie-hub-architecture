# Booking Service Integration Tests

This directory contains integration tests for the `booking-service` microservice.

## Test Architecture

### Key Principles

1. **Database**: Uses **REAL PostgreSQL** - tests run against the actual database
2. **External Services**: **MOCKED**
   - `cinema-service` (RPC Client) - showtime/seat data
   - `user-service` (RPC Client) - user details
   - `NotificationService` - email/SMS
   - Redis pub/sub events
3. **Protocol Adaptation**: Since this is a TCP microservice (`@MessagePattern`), we **inject controllers directly**

### Test Structure

```
test/integration/booking-service/
├── helpers/
│   └── booking-test-helpers.ts     # Test utilities, mocks, VNPay checksum
├── 1.booking-module.spec.ts        # Booking CRUD, status transitions
├── 2.payment-module.spec.ts        # Payment + VNPay IPN with checksum
├── 3.concession-module.spec.ts     # Concession CRUD
├── 4.loyalty-module.spec.ts        # Loyalty points, transactions
├── 5.promotion-module.spec.ts      # Promotion validation
├── 6.refund-module.spec.ts         # Refund with status cascades
└── README.md                       # This file
```

## Running the Tests

### Prerequisites

1. Docker must be running with the PostgreSQL database
2. The `booking-service` database must be migrated

```bash
# Start the database
docker-compose up -d postgres

# Run migrations (if needed)
npx nx run booking-service:prisma-migrate
```

### Run All Booking Service Tests

```bash
# Run all integration tests for booking-service
npx jest --config=apps/booking-service/jest.config.ts test/integration/booking-service
```

### Run Specific Test Files

```bash
# Run Booking Module
npx jest test/integration/booking-service/1.booking-module.spec.ts

# Run Payment Module (VNPay tests)
npx jest test/integration/booking-service/2.payment-module.spec.ts

# Run other modules
npx jest test/integration/booking-service/3.concession-module.spec.ts
npx jest test/integration/booking-service/4.loyalty-module.spec.ts
npx jest test/integration/booking-service/5.promotion-module.spec.ts
npx jest test/integration/booking-service/6.refund-module.spec.ts
```

### Run with Verbose Output

```bash
npx jest --config=apps/booking-service/jest.config.ts test/integration/booking-service --verbose
```

## Test Coverage Reference

### 1. Booking Module (`1.booking-module.spec.ts`)

| Operation          | Test Scenarios                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `createBooking`    | ✅ Creates pending booking with 15-min TTL, ✅ Returns existing pending booking, ✅ Unique booking codes |
| `findAll`          | ✅ Pagination, ✅ Filter by status, ✅ User isolation                                                    |
| `findOne`          | ✅ Return by ID, ❌ Not found, ❌ Wrong user                                                             |
| `getSummary`       | ✅ Pricing breakdown, ✅ Tax calculation, ✅ Ticket grouping                                             |
| `cancelBooking`    | ✅ Cancel pending, ✅ Cancel confirmed, ✅ Set reason/timestamp, ❌ Already cancelled                    |
| `adminFindAll`     | ✅ All bookings, ✅ Filter by userId/status/date                                                         |
| Status Transitions | ✅ PENDING→CONFIRMED, ✅ CONFIRMED→COMPLETED, ✅ PENDING→EXPIRED                                         |

### 2. Payment Module (`2.payment-module.spec.ts`)

| Operation        | Test Scenarios                                                                        |
| ---------------- | ------------------------------------------------------------------------------------- |
| `createPayment`  | ✅ Generate VNPay URL, ✅ Store payment URL                                           |
| `handleVNPayIPN` | **Checksum**: ❌ Invalid hash, ✅ Valid hash                                          |
|                  | **Success (00)**: ✅ Payment COMPLETED, ✅ Booking CONFIRMED, ✅ Tickets VALID        |
|                  | **Failure (24,51,75)**: ✅ Payment FAILED, ✅ Booking CANCELLED, ✅ Tickets CANCELLED |
| `findOne`        | ✅ By ID                                                                              |
| `findByBooking`  | ✅ By booking ID                                                                      |
| `adminFindAll`   | ✅ Pagination, ✅ Filter by status                                                    |

### 3. Concession Module (`3.concession-module.spec.ts`)

| Operation         | Test Scenarios                                           |
| ----------------- | -------------------------------------------------------- |
| `findAll`         | ✅ All, ✅ Filter by category, ✅ Filter by availability |
| `findOne`         | ✅ By ID, ✅ Not found                                   |
| `create`          | ✅ All fields, ✅ With inventory                         |
| `update`          | ✅ Price, ✅ Availability                                |
| `delete`          | ✅ Remove                                                |
| `updateInventory` | ✅ Set count                                             |

### 4. Loyalty Module (`4.loyalty-module.spec.ts`)

| Operation         | Test Scenarios                                                      |
| ----------------- | ------------------------------------------------------------------- |
| `getBalance`      | ✅ Existing account, ✅ **Auto-create Bronze** if not exists        |
| `earnPoints`      | ✅ Add points, ✅ Update lifetime, ✅ Create transaction            |
| `redeemPoints`    | ✅ Deduct points, ✅ Create transaction, ❌ **Insufficient points** |
| `getTransactions` | ✅ Pagination, ✅ Filter by type                                    |

### 5. Promotion Module (`5.promotion-module.spec.ts`)

| Operation      | Test Scenarios                                                         |
| -------------- | ---------------------------------------------------------------------- |
| `findAll`      | ✅ All, ✅ Filter by active, ✅ Filter by type                         |
| `validate`     | ✅ Percentage discount, ✅ Cap at maxDiscount, ✅ Fixed amount         |
|                | ❌ Expired, ❌ Usage limit reached, ❌ Below min purchase, ❌ Inactive |
| `create`       | ✅ All fields, ❌ Duplicate code                                       |
| `update`       | ✅ Value                                                               |
| `delete`       | ✅ Remove                                                              |
| `toggleActive` | ✅ Toggle status                                                       |

### 6. Refund Module (`6.refund-module.spec.ts`)

| Operation       | Test Scenarios                                                         |
| --------------- | ---------------------------------------------------------------------- |
| `createRefund`  | ✅ For completed payment, ✅ Full amount, ❌ **Exceeds payment**       |
| `findAll`       | ✅ Pagination, ✅ Filter by status                                     |
| `findOne`       | ✅ By ID                                                               |
| `findByPayment` | ✅ By payment ID                                                       |
| `approve`       | ✅ Status COMPLETED, ✅ **Payment→REFUNDED**, ✅ **Booking→CANCELLED** |
| `reject`        | ✅ Status REJECTED, ✅ Store reason, ✅ No payment update              |

## Key Test Focus Areas

### ⚠️ VNPay Checksum Validation

The `handleVNPayIPN` endpoint enforces HMAC-SHA512 signature validation:

```typescript
// Helper to generate valid checksum
export function generateVNPayChecksum(params: Record<string, string>, secretKey: string): string {
  const sortedParams = Object.keys(params)
    .filter((key) => key !== 'vnp_SecureHash')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHmac('sha512', secretKey).update(sortedParams).digest('hex').toUpperCase();
}

// Use in tests
const params = createMockVNPayIPN(
  bookingId,
  transactionId,
  160000,
  '00', // Success code
  VNPAY_SECRET
);
await paymentController.handleVNPayIPN({ params });
```

### ⚠️ Mock Heavy: getBookingSummary Dependencies

The booking summary calculation depends on multiple services:

```typescript
// Mocked Cinema Service
const mockCinemaClient = {
  send: jest.fn().mockImplementation((pattern) => {
    if (pattern === 'SHOWTIME.GET_SHOWTIME_SEATS') {
      return Promise.resolve({ seat_map: [...], cinemaName: 'Test' });
    }
    if (pattern === 'SHOWTIME.GET_SEATS_HELD_BY_USER') {
      return Promise.resolve({ seats: [...], ttl: 900 });
    }
  }),
};

// Mocked User Service
const mockUserClient = {
  send: jest.fn().mockImplementation((pattern, data) => {
    if (pattern === 'USER.GET_USER_DETAIL') {
      return Promise.resolve({ id: data, fullName: 'Test User' });
    }
  }),
};
```

### ⚠️ Async Email (Unawaited)

The payment handler fires async email without awaiting:

```typescript
// In PaymentService.handleVNPayIPN
sendBookingConfirmationEmailAsync(booking); // Unawaited!
return { RspCode: '00', Message: 'success' }; // Returns immediately
```

Tests should add a small delay if checking email mock calls:

```typescript
await paymentController.handleVNPayIPN({ params });
await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for async
expect(mockNotificationService.sendBookingConfirmationEmail).toHaveBeenCalled();
```

### ⚠️ Refund Amount Constraint

Refund amount must not exceed payment amount:

```typescript
it('should fail when refund amount exceeds payment amount', async () => {
  await expect(
    refundController.create({
      dto: { paymentId, amount: 1000000 }, // More than payment
    })
  ).rejects.toThrow();
});
```

### ⚠️ Status Cascades on Refund Approval

Approving a refund triggers multiple status changes:

```
Refund.status   →  COMPLETED
Payment.status  →  REFUNDED
Booking.status  →  CANCELLED
```

## Database Schema Relationships

```
Bookings (id, user_id, showtime_id, status, payment_status, ...)
   ↓
Tickets (id, booking_id, seat_id, status, ...)
   ↓
BookingConcessions (booking_id, concession_id, quantity, ...)
   ↓
Payments (id, booking_id, amount, status, transaction_id, ...)
   ↓
Refunds (id, payment_id, amount, status, reason, ...)

LoyaltyAccounts (id, user_id, current_points, tier, ...)
   ↓
LoyaltyTransactions (id, account_id, points, type, ...)

Concessions (id, name, price, category, available, ...)

Promotions (id, code, type, value, min_purchase, max_discount, ...)
```

## VNPay Response Codes

| Code | Meaning            | Action                               |
| ---- | ------------------ | ------------------------------------ |
| `00` | Success            | Payment COMPLETED, Booking CONFIRMED |
| `24` | Cancelled by user  | Payment FAILED, Booking CANCELLED    |
| `51` | Insufficient funds | Payment FAILED, Booking CANCELLED    |
| `75` | Transaction limit  | Payment FAILED, Booking CANCELLED    |

## Cleanup Strategy

Each test file follows this pattern:

```typescript
beforeAll(async () => {
  ctx = await createBookingTestingModule();
}, 60000);

afterAll(async () => {
  await cleanupBookingTestData(ctx.prisma);
  await closeBookingTestContext(ctx);
}, 30000);

beforeEach(async () => {
  await cleanupBookingsOnly(ctx.prisma);
  ctx.mockCinemaClient.send.mockClear();
  ctx.mockNotificationService.sendBookingConfirmationEmail.mockClear();
});
```

## Troubleshooting

### VNPay Checksum Fails

Ensure params are sorted alphabetically and `vnp_SecureHash` is excluded from the hash input.

### Mock Not Applied

RPC clients are injected via `SERVICE_NAME.CINEMA` and `SERVICE_NAME.USER`. Ensure these tokens match.

### Async Email Test Flaky

Add a small delay (50-100ms) after IPN handling before checking email mock.

### Database Constraint Violations

Run cleanup in correct order due to foreign keys:

1. Refunds
2. Payments
3. Tickets
4. BookingConcessions
5. Bookings

## Reference Documentation

For detailed business logic and test scenarios, see:

- [BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md](../../docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md)
