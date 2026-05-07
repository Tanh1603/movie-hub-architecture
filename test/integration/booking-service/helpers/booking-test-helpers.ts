/**
 * Booking Service Integration Test Helpers
 *
 * This file provides utilities for setting up and tearing down integration tests
 * for the booking-service microservice.
 *
 * Key principles:
 * - Use REAL PostgreSQL database (no mocking of PrismaService)
 * - Mock external RPC services (cinema-service, user-service)
 * - Mock notification service (email/SMS)
 * - Mock Redis event service (pub/sub)
 * - Inject controllers directly for TCP microservice testing
 *
 * ⚠️ Key Considerations:
 * - getBookingSummary depends on Cinema & User services - heavy mocking required
 * - VNPay IPN requires HMAC-SHA512 checksum validation
 * - Async email sending is unawaited - tests should handle this carefully
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import {
  SERVICE_NAME,
  BookingStatus,
  PaymentStatus,
  TicketStatus,
} from '@movie-hub/shared-types';
import * as crypto from 'crypto';
import { of } from 'rxjs';

// Import services and controllers
import { PrismaService } from '../../../../apps/booking-service/src/app/prisma.service';
import { BookingController } from '../../../../apps/booking-service/src/app/booking/booking.controller';
import { BookingService } from '../../../../apps/booking-service/src/app/booking/booking.service';
import { PaymentController } from '../../../../apps/booking-service/src/app/payment/payment.controller';
import { PaymentService } from '../../../../apps/booking-service/src/app/payment/payment.service';
import { ConcessionController } from '../../../../apps/booking-service/src/app/concession/concession.controller';
import { ConcessionService } from '../../../../apps/booking-service/src/app/concession/concession.service';
import { LoyaltyController } from '../../../../apps/booking-service/src/app/loyalty/loyalty.controller';
import { LoyaltyService } from '../../../../apps/booking-service/src/app/loyalty/loyalty.service';
import { PromotionController } from '../../../../apps/booking-service/src/app/promotion/promotion.controller';
import { PromotionService } from '../../../../apps/booking-service/src/app/promotion/promotion.service';
import { RefundController } from '../../../../apps/booking-service/src/app/refund/refund.controller';
import { RefundService } from '../../../../apps/booking-service/src/app/refund/refund.service';
import { NotificationService } from '../../../../apps/booking-service/src/app/notification/notification.service';
import { BookingEventService } from '../../../../apps/booking-service/src/app/redis/booking-event.service';
import { TicketService } from '../../../../apps/booking-service/src/app/ticket/ticket.service';

// ============================================================================
// MOCK PROVIDERS
// ============================================================================

/**
 * Mock for Cinema Service (RPC Client)
 */
export const createMockCinemaClient = () => ({
  send: jest.fn().mockImplementation((pattern: string, data: any) => {
    // Mock responses based on message pattern
    if (pattern === 'showtime.get_showtime_seats') {
      return of({
        showtime: {
          id: data.showtimeId,
          movieTitle: 'Mock Movie',
          start_time: new Date(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
          format: '2D',
          language: 'Vietnamese',
        },
        cinemaName: 'Mock Cinema',
        hallName: 'Hall A',
        seat_map: [
          {
            row: 'A',
            seats: [
              {
                id: '20000000-0000-0000-0000-000000000001',
                number: 1,
                seatType: 'STANDARD',
                status: 'AVAILABLE',
              },
              {
                id: '20000000-0000-0000-0000-000000000002',
                number: 2,
                seatType: 'STANDARD',
                status: 'AVAILABLE',
              },
              { id: '20000000-0000-0000-0000-000000000003', number: 3, seatType: 'VIP', status: 'AVAILABLE' },
            ],
          },
        ],
      });
    }
    if (pattern === 'showtime.get_seats_held_by_user') {
      return of({
        seats: [
          {
            id: '20000000-0000-0000-0000-000000000001',
            row: 'A',
            number: 1,
            seatType: 'STANDARD',
            price: 80000,
          },
          {
            id: '20000000-0000-0000-0000-000000000002',
            row: 'A',
            number: 2,
            seatType: 'STANDARD',
            price: 80000,
          },
        ],
        ttl: 900, // 15 minutes
      });
    }
    return of({});
  }),
  emit: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock for User Service (RPC Client)
 */
export const createMockUserClient = () => ({
  send: jest.fn().mockImplementation((pattern: string, data: any) => {
    if (pattern === 'user.getDetail') {
      return of({
        id: data,
        email: `${data}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        phone: '0901234567',
        imageUrl: 'https://example.com/avatar.jpg',
      });
    }
    return of({});
  }),
  emit: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock for Notification Service (Email/SMS)
 */
export const createMockNotificationService = () => ({
  sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
  sendBookingConfirmationSMS: jest.fn().mockResolvedValue(undefined),
  sendBookingCancellation: jest.fn().mockResolvedValue(undefined),
  sendPaymentReceipt: jest.fn().mockResolvedValue(undefined),
  sendRefundNotification: jest.fn().mockResolvedValue(undefined),
});

export type MockNotificationService = ReturnType<
  typeof createMockNotificationService
>;

// ============================================================================
// TEST MODULE BUILDER
// ============================================================================

export interface BookingTestContext {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
  bookingController: BookingController;
  paymentController: PaymentController;
  concessionController: ConcessionController;
  loyaltyController: LoyaltyController;
  promotionController: PromotionController;
  refundController: RefundController;
  mockCinemaClient: ReturnType<typeof createMockCinemaClient>;
  mockUserClient: ReturnType<typeof createMockUserClient>;
  mockNotificationService: MockNotificationService;
}

/**
 * Creates a testing module for booking-service integration tests
 */
export async function createBookingTestingModule(): Promise<BookingTestContext> {
  const mockCinemaClient = createMockCinemaClient();
  const mockUserClient = createMockUserClient();
  const mockNotificationService = createMockNotificationService();

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.test', '.env'],
        ignoreEnvFile: false,
        load: [
          () => ({
            // VNPay config for checksum testing
            VNPAY_HASH_SECRET: 'test-vnpay-secret-key',
            VNPAY_TMN_CODE: 'TESTCODE',
            VNPAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            VNPAY_RETURN_URL: 'http://localhost:3000/payment/return',
          }),
        ],
      }),
      CacheModule.register({
        isGlobal: true,
      }),
    ],
    controllers: [
      BookingController,
      PaymentController,
      ConcessionController,
      LoyaltyController,
      PromotionController,
      RefundController,
    ],
    providers: [
      PrismaService,
      BookingService,
      PaymentService,
      ConcessionService,
      LoyaltyService,
      PromotionService,
      RefundService,
      TicketService,
      BookingEventService,
      {
        provide: 'REDIS_BOOKING',
        useValue: {
          publish: jest.fn(),
          subscribe: jest.fn(),
        },
      },
      {
        provide: SERVICE_NAME.CINEMA,
        useValue: mockCinemaClient,
      },
      {
        provide: SERVICE_NAME.USER,
        useValue: mockUserClient,
      },
      {
        provide: NotificationService,
        useValue: mockNotificationService,
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);

  return {
    app,
    module: moduleRef,
    prisma,
    bookingController: moduleRef.get<BookingController>(BookingController),
    paymentController: moduleRef.get<PaymentController>(PaymentController),
    concessionController:
      moduleRef.get<ConcessionController>(ConcessionController),
    loyaltyController: moduleRef.get<LoyaltyController>(LoyaltyController),
    promotionController:
      moduleRef.get<PromotionController>(PromotionController),
    refundController: moduleRef.get<RefundController>(RefundController),
    mockCinemaClient,
    mockUserClient,
    mockNotificationService,
  };
}

// ============================================================================
// DATABASE CLEANUP UTILITIES
// ============================================================================

/**
 * Cleans up all booking-related test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanupBookingTestData(
  prisma: PrismaService
): Promise<void> {
  try {
    // Delete in reverse order of dependencies
    await prisma.refunds.deleteMany({});
    await prisma.payments.deleteMany({});
    await prisma.tickets.deleteMany({});
    await prisma.bookingConcessions.deleteMany({});
    await prisma.bookings.deleteMany({});
    await prisma.loyaltyTransactions.deleteMany({});
    await prisma.loyaltyAccounts.deleteMany({});
    await prisma.concessions.deleteMany({});
    await prisma.promotions.deleteMany({});
  } catch (error) {
    console.warn('Cleanup failed (some tables may not exist):', error);
  }
}

/**
 * Cleanup only bookings and related records
 */
export async function cleanupBookingsOnly(
  prisma: PrismaService
): Promise<void> {
  try {
    await prisma.refunds.deleteMany({});
    await prisma.payments.deleteMany({});
    await prisma.tickets.deleteMany({});
    await prisma.bookingConcessions.deleteMany({});
    await prisma.bookings.deleteMany({});
  } catch (error) {
    console.warn('Booking cleanup failed:', error);
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Creates a test booking request
 */
export function createTestBookingRequest(
  showtimeId: string = '123e4567-e89b-12d3-a456-426614174000'
): { showtimeId: string } {
  return { showtimeId };
}

/**
 * Creates a test concession request
 */
export function createTestConcessionRequest(
  overrides: Partial<CreateConcessionTestData> = {}
): CreateConcessionTestData {
  return {
    name: `Test Popcorn ${Date.now()}`,
    description: 'Large popcorn with butter',
    price: 45000,
    category: 'FOOD',
    imageUrl: 'https://example.com/popcorn.jpg',
    available: true,
    inventoryCount: 100,
    ...overrides,
  };
}

export interface CreateConcessionTestData {
  name: string;
  description: string;
  price: number;
  category: 'FOOD' | 'DRINK' | 'COMBO' | 'MERCHANDISE';
  imageUrl?: string;
  cinemaId?: string;
  available: boolean;
  inventoryCount: number;
}

/**
 * Creates a test promotion request
 */
export function createTestPromotionRequest(
  overrides: Partial<CreatePromotionTestData> = {}
): CreatePromotionTestData {
  const now = new Date();
  const validFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
  const validTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  return {
    name: `Promotion ${Date.now()}`,
    code: `PROMO${Date.now()}`,
    description: 'Test promotion',
    type: 'PERCENTAGE',
    value: 10,
    minPurchase: 100000,
    maxDiscount: 50000,
    usageLimit: 100,
    validFrom,
    validTo,
    active: true,
    ...overrides,
  };
}

export interface CreatePromotionTestData {
  name: string;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: Date;
  validTo: Date;
  active: boolean;
}

// ============================================================================
// SEED DATA HELPERS
// ============================================================================

/**
 * Seeds a test booking with pending status
 */
export async function seedPendingBooking(
  prisma: PrismaService,
  userId: string,
  showtimeId: string = '123e4567-e89b-12d3-a456-426614174000'
): Promise<string> {
  const booking = await prisma.bookings.create({
    data: {
      booking_code: `BK${Date.now()}${Math.floor(Math.random() * 10000)}`,
      user_id: userId,
      showtime_id: showtimeId,
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '0901234567',
      subtotal: 160000,
      discount: 0,
      points_used: 0,
      points_discount: 0,
      final_amount: 160000,
      status: BookingStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // Create tickets
  await prisma.tickets.createMany({
    data: [
      {
        booking_id: booking.id,
        seat_id: '20000000-0000-0000-0000-000000000001',
        ticket_type: 'ADULT',
        price: 80000,
        ticket_code: `TK${Date.now()}1-${Math.floor(Math.random() * 10000)}`,
        status: TicketStatus.VALID,
      },
      {
        booking_id: booking.id,
        seat_id: '20000000-0000-0000-0000-000000000002',
        ticket_type: 'ADULT',
        price: 80000,
        ticket_code: `TK${Date.now()}2-${Math.floor(Math.random() * 10000)}`,
        status: TicketStatus.VALID,
      },
    ],
  });

  return booking.id;
}

/**
 * Seeds a confirmed booking with completed payment
 */
export async function seedConfirmedBooking(
  prisma: PrismaService,
  userId: string,
  showtimeId: string = '123e4567-e89b-12d3-a456-426614174000'
): Promise<{ bookingId: string; paymentId: string }> {
  const booking = await prisma.bookings.create({
    data: {
      booking_code: `BK${Date.now()}${Math.floor(Math.random() * 10000)}`,
      user_id: userId,
      showtime_id: showtimeId,
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '0901234567',
      subtotal: 160000,
      discount: 0,
      points_used: 0,
      points_discount: 0,
      final_amount: 160000,
      status: BookingStatus.CONFIRMED,
      payment_status: PaymentStatus.COMPLETED,
    },
  });

  // Create tickets
  await prisma.tickets.createMany({
    data: [
      {
        booking_id: booking.id,
        seat_id: '20000000-0000-0000-0000-000000000001',
        ticket_type: 'ADULT',
        price: 80000,
        ticket_code: `TK${Date.now()}1-${Math.floor(Math.random() * 10000)}`,
        status: TicketStatus.VALID,
      },
      {
        booking_id: booking.id,
        seat_id: '20000000-0000-0000-0000-000000000002',
        ticket_type: 'ADULT',
        price: 80000,
        ticket_code: `TK${Date.now()}2-${Math.floor(Math.random() * 10000)}`,
        status: TicketStatus.VALID,
      },
    ],
  });

  // Create payment
  const payment = await prisma.payments.create({
    data: {
      booking_id: booking.id,
      amount: 160000,
      payment_method: 'VNPAY',
      status: PaymentStatus.COMPLETED,
      transaction_id: `TXN${Date.now()}`,
    },
  });

  return { bookingId: booking.id, paymentId: payment.id };
}

/**
 * Seeds a loyalty account for user
 */
export async function seedLoyaltyAccount(
  prisma: PrismaService,
  userId: string,
  points: number = 100,
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE'
): Promise<string> {
  const account = await prisma.loyaltyAccounts.create({
    data: {
      user_id: userId,
      current_points: points,
      tier,
    },
  });
  return account.id;
}

/**
 * Seeds test concessions
 */
export async function seedTestConcessions(
  prisma: PrismaService,
  count: number = 3
): Promise<string[]> {
  const ids: string[] = [];
  const categories = ['FOOD', 'DRINK', 'COMBO', 'MERCHANDISE'];
  const names = ['Popcorn', 'Cola', 'Combo Large', 'Nachos'];

  for (let i = 0; i < count; i++) {
    const concession = await prisma.concessions.create({
      data: {
        name: names[i] || `Item ${i}`,
        description: `Test ${names[i] || 'item'}`,
        price: 30000 + i * 15000,
        category: categories[i % categories.length] as any,
        available: true,
      },
    });
    ids.push(concession.id);
  }

  return ids;
}

/**
 * Seeds a test promotion
 */
export async function seedTestPromotion(
  prisma: PrismaService,
  code: string = 'TESTCODE',
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' = 'PERCENTAGE',
  value: number = 10
): Promise<string> {
  const promotion = await prisma.promotions.create({
    data: {
      name: `Promotion ${code}`,
      code,
      description: 'Test promotion',
      type,
      value,
      min_purchase: 100000,
      max_discount: 50000,
      usage_limit: 100,
      current_usage: 0,
      valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
    },
  });
  return promotion.id;
}

// ============================================================================
// VNPAY HELPER UTILITIES
// ============================================================================

/**
 * Generates a valid VNPay IPN checksum for testing
 * The checksum is HMAC-SHA512 of sorted query params
 */
export function generateVNPayChecksum(
  params: Record<string, string>,
  secretKey: string
): string {
  // Sort params alphabetically (excluding vnp_SecureHash)
  const sortedParams = Object.keys(params)
    .filter((key) => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  // Generate HMAC-SHA512
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(sortedParams)
    .digest('hex');

  return hash.toUpperCase();
}

/**
 * Creates a mock VNPay IPN payload with valid checksum
 */
export function createMockVNPayIPN(
  paymentId: string,
  transactionId: string,
  amount: number,
  responseCode: string = '00', // 00 = success
  secretKey: string = 'test-vnpay-secret-key'
): Record<string, string> {
  const params: Record<string, string> = {
    vnp_TmnCode: 'TESTCODE',
    vnp_Amount: (amount * 100).toString(), // VNPay uses amount in cents
    vnp_BankCode: 'NCB',
    vnp_BankTranNo: `NCB${Date.now()}`,
    vnp_CardType: 'ATM',
    vnp_OrderInfo: paymentId,
    vnp_PayDate: new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .substring(0, 14),
    vnp_ResponseCode: responseCode,
    vnp_TransactionNo: transactionId,
    vnp_TransactionStatus: responseCode,
    vnp_TxnRef: paymentId,
  };

  // Add checksum
  params.vnp_SecureHash = generateVNPayChecksum(params, secretKey);
  params.vnp_SecureHashType = 'SHA512';

  return params;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Verifies that a booking was created with expected status
 */
export async function verifyBookingStatus(
  prisma: PrismaService,
  bookingId: string,
  expectedStatus: BookingStatus,
  expectedPaymentStatus?: PaymentStatus
): Promise<void> {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
  });

  expect(booking).not.toBeNull();
  expect(booking?.status).toBe(expectedStatus);

  if (expectedPaymentStatus) {
    expect(booking?.payment_status).toBe(expectedPaymentStatus);
  }
}

/**
 * Verifies that tickets have expected status
 */
export async function verifyTicketsStatus(
  prisma: PrismaService,
  bookingId: string,
  expectedStatus: TicketStatus
): Promise<void> {
  const tickets = await prisma.tickets.findMany({
    where: { booking_id: bookingId },
  });

  expect(tickets.length).toBeGreaterThan(0);
  tickets.forEach((ticket) => {
    expect(ticket.status).toBe(expectedStatus);
  });
}

// ============================================================================
// TEARDOWN UTILITY
// ============================================================================

/**
 * Properly closes the test context to prevent Jest hangs
 */
export async function closeBookingTestContext(
  context: BookingTestContext
): Promise<void> {
  try {
    await context.prisma.$disconnect();
    await context.app.close();
  } catch (error) {
    console.warn('Error during test context cleanup:', error);
  }
}
