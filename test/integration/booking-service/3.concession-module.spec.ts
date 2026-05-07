/**
 * Concession Module Integration Tests
 *
 * Tests the Concession CRUD operations:
 * - findAll (with filters)
 * - findOne
 * - create
 * - update
 * - delete
 * - updateInventory
 *
 * @see test/docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md Section 3
 */

import {
  BookingTestContext,
  createBookingTestingModule,
  cleanupBookingTestData,
  closeBookingTestContext,
  createTestConcessionRequest,
  seedTestConcessions,
} from './helpers/booking-test-helpers';

describe('Concession Module Integration Tests', () => {
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
    await ctx.prisma.concessions.deleteMany({});
  });

  // ============================================================================
  // 3.1 findAll
  // ============================================================================

  describe('3.1 findAll', () => {
    beforeEach(async () => {
      await seedTestConcessions(ctx.prisma, 4);
    });

    describe('Success Scenarios', () => {
      it('should return all concessions', async () => {
        // Act
        const result = await ctx.concessionController.findAll({});

        // Assert
        expect(result.data.length).toBe(4);
      });

      it('should filter by category', async () => {
        // Act
        const result = await ctx.concessionController.findAll({
          category: 'FOOD' as any,
        });

        // Assert
        result.data.forEach((c) => {
          expect(c.category).toBe('FOOD');
        });
      });

      it('should filter by availability', async () => {
        // Arrange - Make one unavailable
        const concessions = await ctx.prisma.concessions.findMany();
        await ctx.prisma.concessions.update({
          where: { id: concessions[0].id },
          data: { available: false },
        });

        // Act
        const result = await ctx.concessionController.findAll({
          available: true,
        });

        // Assert
        expect(result.data.length).toBe(3);
        result.data.forEach((c) => {
          expect(c.available).toBe(true);
        });
      });
    });
  });

  // ============================================================================
  // 3.2 findOne
  // ============================================================================

  describe('3.2 findOne', () => {
    let testConcessionId: string;

    beforeEach(async () => {
      const ids = await seedTestConcessions(ctx.prisma, 1);
      testConcessionId = ids[0];
    });

    it('should return concession by ID', async () => {
      // Act
      const result = await ctx.concessionController.findOne({
        id: testConcessionId,
      });

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(testConcessionId);
      expect(result.data.name).toBeDefined();
      expect(result.data.price).toBeDefined();
    });

    it('should return null for non-existent concession', async () => {
      // Act & Assert
      await expect(
        ctx.concessionController.findOne({
          id: '123e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow('Concession not found');
    });
  });

  // ============================================================================
  // 3.3 create
  // ============================================================================

  describe('3.3 create', () => {
    describe('Success Scenarios', () => {
      it('should create concession with all fields', async () => {
        // Arrange
        const dto = createTestConcessionRequest({
          name: 'Large Popcorn',
          price: 50000,
          category: 'FOOD' as any,
        });

        // Act
        const result = await ctx.concessionController.create({ dto: dto as any });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBeDefined();
        expect(result.data.name).toBe('Large Popcorn');
        expect(result.data.price).toBe(50000);
        expect(result.data.category).toBe('FOOD');

        // Verify in database
        const dbConcession = await ctx.prisma.concessions.findUnique({
          where: { id: result.data.id },
        });
        expect(dbConcession).not.toBeNull();
      });

      it('should create concession with inventory', async () => {
        // Arrange
        const dto = createTestConcessionRequest({
          inventory: 500,
        } as any);

        // Act
        const result = await ctx.concessionController.create({ dto: dto as any });

        // Assert
        expect((result.data as any).inventory).toBe(500);
      });
    });
  });

  // ============================================================================
  // 3.4 update
  // ============================================================================

  describe('3.4 update', () => {
    let testConcessionId: string;

    beforeEach(async () => {
      const ids = await seedTestConcessions(ctx.prisma, 1);
      testConcessionId = ids[0];
    });

    it('should update concession price', async () => {
      // Arrange
      const dto = { price: 75000 };

      // Act
      const result = await ctx.concessionController.update({
        id: testConcessionId,
        dto,
      });

      // Assert
      expect(result.data.price).toBe(75000);
    });

    it('should update availability', async () => {
      // Arrange
      const dto = { available: false };

      // Act
      const result = await ctx.concessionController.update({
        id: testConcessionId,
        dto,
      });

      // Assert
      expect(result.data.available).toBe(false);
    });
  });

  // ============================================================================
  // 3.5 delete
  // ============================================================================

  describe('3.5 delete', () => {
    let testConcessionId: string;

    beforeEach(async () => {
      const ids = await seedTestConcessions(ctx.prisma, 1);
      testConcessionId = ids[0];
    });

    it('should delete concession', async () => {
      // Verify exists
      let concession = await ctx.prisma.concessions.findUnique({
        where: { id: testConcessionId },
      });
      expect(concession).not.toBeNull();

      // Act
      await ctx.concessionController.delete({ id: testConcessionId });

      // Assert
      concession = await ctx.prisma.concessions.findUnique({
        where: { id: testConcessionId },
      });
      expect(concession).toBeNull();
    });
  });

  // ============================================================================
  // 3.6 updateInventory
  // ============================================================================

  describe('3.6 updateInventory', () => {
    let testConcessionId: string;

    beforeEach(async () => {
      const concession = await ctx.prisma.concessions.create({
        data: {
          name: 'Inventory Test',
          description: 'Test',
          price: 10000,
                category: "MERCHANDISE",
          available: true,
          inventory: 50,
        } as any,
      });
      testConcessionId = concession.id;
    });

    it('should update inventory count', async () => {
      // Act
      const result = await ctx.concessionController.updateInventory({
        id: testConcessionId,
        quantity: 100,
      });

      // Assert
      expect((result.data as any).inventory).toBe(150);
    });

    it('should set to zero when negative value provided', async () => {
      // Act
      const result = await ctx.concessionController.updateInventory({
        id: testConcessionId,
        quantity: -50,
      });

      // Assert
      expect((result.data as any).inventory).toBe(0);
    });
  });
});
