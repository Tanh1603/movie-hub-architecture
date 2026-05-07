/**
 * Promotion Module Integration Tests
 *
 * Tests the Promotion operations:
 * - findAll
 * - validate (with various scenarios)
 * - create
 * - update
 * - delete
 * - toggleActive
 *
 * @see test/docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md Section 5
 */

import {
  BookingTestContext,
  createBookingTestingModule,
  cleanupBookingTestData,
  closeBookingTestContext,
  createTestPromotionRequest,
  seedTestPromotion,
} from './helpers/booking-test-helpers';

describe('Promotion Module Integration Tests', () => {
  let ctx: BookingTestContext;

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
    await cleanupBookingTestData(ctx.prisma);
  });

  // ============================================================================
  // 5.1 findAll
  // ============================================================================

  describe('5.1 findAll', () => {
    beforeEach(async () => {
      // Create various promotions
      await ctx.prisma.promotions.createMany({
        data: [
          {
            name: 'Active Promotion 1',
            code: 'ACTIVE1',
            description: 'Active promo 1',
            type: 'PERCENTAGE',
            value: 10,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            active: true,
          },
          {
            name: 'Active Promotion 2',
            code: 'ACTIVE2',
            description: 'Active promo 2',
            type: 'FIXED_AMOUNT',
            value: 50000,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            active: true,
          },
          {
            name: 'Inactive Promotion',
            code: 'INACTIVE1',
            description: 'Inactive promo',
            type: 'PERCENTAGE',
            value: 20,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            active: false,
          },
        ],
      });
    });

    it('should return all promotions', async () => {
      // Act
      const result = await ctx.promotionController.findAll({});

      // Assert
      expect(result.data.length).toBe(3);
    });

    it('should filter by active status', async () => {
      // Act
      const activeResult = await ctx.promotionController.findAll({
        active: true,
      });
      const inactiveResult = await ctx.promotionController.findAll({
        active: false,
      });

      // Assert
      expect(activeResult.data.length).toBe(2);
      expect(inactiveResult.data.length).toBe(1);
    });

          it('should filter by type', async () => {
            // Act
            const result = await ctx.promotionController.findAll({
              type: 'PERCENTAGE' as any,
            });
      // Assert
      expect(result.data.length).toBe(2);
      result.data.forEach((p) => {
        expect(p.type).toBe('PERCENTAGE');
      });
    });
  });

  // ============================================================================
  // 5.2 validate
  // ============================================================================

  describe('5.2 validate', () => {
    describe('Success Scenarios', () => {
      it('should validate percentage promotion and return discount', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Percentage Promotion',
            code: 'PERCENT10',
            description: '10% off',
            type: 'PERCENTAGE',
            value: 10,
            min_purchase: 100000,
            max_discount: 50000,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
            active: true,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'PERCENT10',
          dto: { bookingAmount: 200000 },
        });

        // Assert
        expect(result.data.valid).toBe(true);
        expect(result.data.discountAmount).toBe(20000); // 10% of 200000
      });

      it('should cap discount at maxDiscount', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Capped Promotion',
            code: 'CAPPED',
            description: '50% off max 30k',
            type: 'PERCENTAGE',
            value: 50,
            max_discount: 30000,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
            active: true,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'CAPPED',
          dto: { bookingAmount: 200000 }, // 50% would be 100k, but capped at 30k
        });

        // Assert
        expect(result.data.discountAmount).toBe(30000);
      });

      it('should validate fixed amount promotion', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Fixed Amount Promotion',
            code: 'FIXED50K',
            description: '50k off',
            type: 'FIXED_AMOUNT',
            value: 50000,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
            active: true,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'FIXED50K',
          dto: { bookingAmount: 150000 },
        });

        // Assert
        expect(result.data.valid).toBe(true);
        expect(result.data.discountAmount).toBe(50000);
      });
    });

    describe('Failure Scenarios', () => {
      it('should invalid for expired promotion', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Expired Promotion',
            code: 'EXPIRED',
            description: 'Expired promo',
            type: 'PERCENTAGE',
            value: 10,
            valid_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
            active: true,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'EXPIRED',
          dto: { bookingAmount: 200000 },
        });

        // Assert
        expect(result.data.valid).toBe(false);
      });

      it('should invalid when usage limit reached', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Limit Reached Promotion',
            code: 'LIMITREACHED',
            description: 'Limit reached',
            type: 'PERCENTAGE',
            value: 10,
            usage_limit: 5,
            current_usage: 5, // Already at limit
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
            active: true,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'LIMITREACHED',
          dto: { bookingAmount: 200000 },
        });

        // Assert
        expect(result.data.valid).toBe(false);
      });

      it('should invalid when below minimum purchase', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Min Purchase Promotion',
            code: 'MINPURCHASE',
            description: 'Min purchase 100k',
            type: 'PERCENTAGE',
            value: 10,
            min_purchase: 100000,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
            active: true,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'MINPURCHASE',
          dto: { bookingAmount: 50000 }, // Below minimum
        });

        // Assert
        expect(result.data.valid).toBe(false);
      });

      it('should invalid for inactive promotion', async () => {
        // Arrange
        await ctx.prisma.promotions.create({
          data: {
            name: 'Inactive Promotion',
            code: 'INACTIVE',
            description: 'Inactive',
            type: 'PERCENTAGE',
            value: 10,
            valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000),
            active: false,
          },
        });

        // Act
        const result = await ctx.promotionController.validate({
          code: 'INACTIVE',
          dto: { bookingAmount: 200000 },
        });

        // Assert
        expect(result.data.valid).toBe(false);
      });

      it('should invalid for non-existent code', async () => {
        // Act
        const result = await ctx.promotionController.validate({
          code: 'NONEXISTENT',
          dto: { bookingAmount: 200000 },
        });

        // Assert
        expect(result.data.valid).toBe(false);
      });
    });
  });

  // ============================================================================
  // 5.3 create
  // ============================================================================

  describe('5.3 create', () => {
    it('should create promotion with all fields', async () => {
      // Arrange
      const dto = createTestPromotionRequest({
        code: 'NEWPROMO',
        type: 'PERCENTAGE',
        value: 15,
      });

      // Act
      const result = await ctx.promotionController.create({ dto: dto as any });

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data.code).toBe('NEWPROMO');
      expect(result.data.type).toBe('PERCENTAGE');
      expect(result.data.value).toBe(15);
    });

    it('should fail when creating duplicate code', async () => {
      // Arrange
      await seedTestPromotion(ctx.prisma, 'DUPLICATE');

      // Act & Assert
              await expect(
                ctx.promotionController.create({
                  dto: createTestPromotionRequest({ code: 'DUPLICATE' }) as any,
                })
              ).rejects.toThrow();    });
  });

  // ============================================================================
  // 5.4 update / delete / toggleActive
  // ============================================================================

  describe('5.4 update', () => {
    let testPromotionId: string;

    beforeEach(async () => {
      testPromotionId = await seedTestPromotion(ctx.prisma, 'UPDATEME');
    });

    it('should update promotion value', async () => {
      // Act
      const result = await ctx.promotionController.update({
        id: testPromotionId,
        dto: { value: 25 },
      });

      // Assert
      expect(result.data.value).toBe(25);
    });
  });

  describe('5.5 delete', () => {
    it('should delete promotion', async () => {
      // Arrange
      const promotionId = await seedTestPromotion(ctx.prisma, 'DELETEME');

      // Act
      await ctx.promotionController.delete({ id: promotionId });

      // Assert
      const deleted = await ctx.prisma.promotions.findUnique({
        where: { id: promotionId },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('5.6 toggleActive', () => {
    it('should toggle active status', async () => {
      // Arrange
      const promotionId = await seedTestPromotion(ctx.prisma, 'TOGGLE');

      // Get initial state
      const before = await ctx.prisma.promotions.findUnique({
        where: { id: promotionId },
      });

      // Act
      const result = await ctx.promotionController.toggleActive({
        id: promotionId,
      });

      // Assert
      expect(result.data.active).toBe(!before?.active);
    });
  });
});
