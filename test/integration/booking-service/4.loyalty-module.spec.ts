/**
 * Loyalty Module Integration Tests
 *
 * Tests the Loyalty operations:
 * - getBalance (auto-create account)
 * - earnPoints
 * - redeemPoints
 * - getTransactions
 *
 * @see test/docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md Section 4
 */

import {
  BookingTestContext,
  createBookingTestingModule,
  cleanupBookingTestData,
  closeBookingTestContext,
  seedLoyaltyAccount,
} from './helpers/booking-test-helpers';

describe('Loyalty Module Integration Tests', () => {
  let ctx: BookingTestContext;
  const testUserId = 'loyalty-test-user';

  // ============================================================================
  // TEST LIFECYCLE
  // ============================================================================

  beforeAll(async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    });
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5438/movie_hub_booking?schema=public';
    ctx = await createBookingTestingModule();
  }, 60000);

  afterAll(async () => {
    await cleanupBookingTestData(ctx.prisma);
    await closeBookingTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    await ctx.prisma.loyaltyTransactions.deleteMany({});
    await ctx.prisma.loyaltyAccounts.deleteMany({});
  });

  // ============================================================================
  // 4.1 getBalance
  // ============================================================================

  describe('4.1 getBalance', () => {
    describe('Success Scenarios', () => {
      it('should return balance for existing account', async () => {
        // Arrange
        await seedLoyaltyAccount(ctx.prisma, testUserId, 500, 'SILVER');

        // Act
        const result = await ctx.loyaltyController.getBalance({
          userId: testUserId,
        });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.currentPoints).toBe(500);
        expect(result.data.tier).toBe('SILVER');
      });

      it('should auto-create Bronze account if not exists', async () => {
        // Act
        const result = await ctx.loyaltyController.getBalance({
          userId: 'new-user-id',
        });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.currentPoints).toBe(0);
        expect(result.data.tier).toBe('BRONZE');

        // Verify account created in database
        const account = await ctx.prisma.loyaltyAccounts.findUnique({
          where: { user_id: 'new-user-id' },
        });
        expect(account).not.toBeNull();
      });

      it('should include total spent', async () => {
        // Arrange
        await ctx.prisma.loyaltyAccounts.create({
          data: {
            user_id: testUserId,
            current_points: 100,
            total_spent: 1500000,
            tier: 'GOLD' as any,
          },
        });

        // Act
        const result = await ctx.loyaltyController.getBalance({
          userId: testUserId,
        });

        // Assert
        expect(result.data.totalSpent).toBe(1500000);
      });
    });
  });

  // ============================================================================
  // 4.2 earnPoints
  // ============================================================================

  describe('4.2 earnPoints', () => {
    beforeEach(async () => {
      await seedLoyaltyAccount(ctx.prisma, testUserId, 100);
    });

    describe('Success Scenarios', () => {
      it('should add points to account', async () => {
        // Act
        await ctx.loyaltyController.earnPoints({
          userId: testUserId,
          points: 50,
          description: 'Movie booking reward',
        });

        // Assert
        const result = await ctx.loyaltyController.getBalance({ userId: testUserId });
        expect(result.data.currentPoints).toBe(150);
      });

      it('should create transaction record', async () => {
        // Act
        await ctx.loyaltyController.earnPoints({
          userId: testUserId,
          points: 75,
          transactionId: '30000000-0000-0000-0000-000000000123',
          description: 'Earned from booking',
        });

        // Assert
        const transactions = await ctx.prisma.loyaltyTransactions.findMany({
          where: { loyalty_account: { user_id: testUserId } },
        });
        expect(transactions.length).toBe(1);
        expect(transactions[0].points).toBe(75);
        expect(transactions[0].type).toBe('EARN');
      });
    });
  });

  // ============================================================================
  // 4.3 redeemPoints
  // ============================================================================

  describe('4.3 redeemPoints', () => {
    beforeEach(async () => {
      await seedLoyaltyAccount(ctx.prisma, testUserId, 500);
    });

    describe('Success Scenarios', () => {
      it('should deduct points from account', async () => {
        // Act
        await ctx.loyaltyController.redeemPoints({
          userId: testUserId,
          points: 100,
          description: 'Discount redemption',
        });

        // Assert
        const result = await ctx.loyaltyController.getBalance({ userId: testUserId });
        expect(result.data.currentPoints).toBe(400);
      });

      it('should create redemption transaction', async () => {
        // Act
        await ctx.loyaltyController.redeemPoints({
          userId: testUserId,
          points: 200,
          transactionId: '30000000-0000-0000-0000-000000000456',
        });

        // Assert
        const transactions = await ctx.prisma.loyaltyTransactions.findMany({
          where: {
            loyalty_account: { user_id: testUserId },
            type: 'REDEEM',
          },
        });
        expect(transactions.length).toBe(1);
        expect(transactions[0].points).toBe(-200);
      });

      it('should allow redeeming all points', async () => {
        // Act
        await ctx.loyaltyController.redeemPoints({
          userId: testUserId,
          points: 500,
        });

        // Assert
        const result = await ctx.loyaltyController.getBalance({ userId: testUserId });
        expect(result.data.currentPoints).toBe(0);
      });
    });

    describe('Failure Scenarios', () => {
      it('should fail when insufficient points', async () => {
        // Act & Assert
        await expect(
          ctx.loyaltyController.redeemPoints({
            userId: testUserId,
            points: 1000, // More than available
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 4.4 getTransactions
  // ============================================================================

  describe('4.4 getTransactions', () => {
    beforeEach(async () => {
      await seedLoyaltyAccount(ctx.prisma, testUserId, 500);

      // Earn some points
      await ctx.loyaltyController.earnPoints({
        userId: testUserId,
        points: 100,
        description: 'First earn',
      });
      await ctx.loyaltyController.earnPoints({
        userId: testUserId,
        points: 50,
        description: 'Second earn',
      });
      // Redeem some
      await ctx.loyaltyController.redeemPoints({
        userId: testUserId,
        points: 75,
        description: 'Redemption',
      });
    });

    it('should return paginated transactions', async () => {
      // Act
      const result = await ctx.loyaltyController.getTransactions({
        userId: testUserId,
        query: { page: 1, limit: 10 },
      });

      // Assert
      expect(result.data.length).toBe(3);
      expect(result.meta?.totalRecords).toBe(3);
    });

    it('should filter by transaction type', async () => {
      // Act
      const earnResult = await ctx.loyaltyController.getTransactions({
        userId: testUserId,
        query: { type: 'EARN' as any, page: 1, limit: 10 },
      });

      const redeemResult = await ctx.loyaltyController.getTransactions({
        userId: testUserId,
        query: { type: 'REDEEM' as any, page: 1, limit: 10 },
      });

      // Assert
      expect(earnResult.data.length).toBe(2);
      expect(redeemResult.data.length).toBe(1);
    });
  });

  // ============================================================================
  // Tier Upgrade Logic
  // ============================================================================

  describe('Tier Upgrade Logic', () => {
    it('should upgrade tier based on total spent', async () => {
      // Arrange - Create Bronze account
      await ctx.prisma.loyaltyAccounts.create({
        data: {
          user_id: testUserId,
          current_points: 0,
          total_spent: 0,
          tier: 'BRONZE' as any,
        },
      });

      // Act - Update total spent
      await (ctx as any).loyaltyController.loyaltyService.updateTotalSpent(testUserId, 25000000);

      // Assert - Check if tier was upgraded to GOLD
      const result = await ctx.loyaltyController.getBalance({ userId: testUserId });
      expect(result.data.tier).toBe('GOLD');
    });
  });
});
