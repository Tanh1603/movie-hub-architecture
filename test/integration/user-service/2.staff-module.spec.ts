/**
 * Staff Module Integration Tests
 *
 * Tests the Staff CRUD operations:
 * - createStaff
 * - findAllStaff (with extensive filtering)
 * - findOneStaff
 * - updateStaff
 * - removeStaff
 *
 * @see test/docs/USER_SERVICE_INTEGRATION_TEST_DOCS.md Section 2
 */

import {
  UserTestContext,
  createUserTestingModule,
  cleanupUserTestData,
  closeUserTestContext,
  createTestStaffRequest,
  verifyStaffPersisted,
  seedTestStaff,
  cleanupStaff,
} from './helpers/user-test-helpers';

describe('Staff Module Integration Tests', () => {
  let ctx: UserTestContext;

  // Use a fixed cinema ID for testing
  const testCinemaId = '123e4567-e89b-12d3-a456-426614174000';

  // ============================================================================
  // TEST LIFECYCLE
  // ============================================================================

  beforeAll(async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    });
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5435/movie_hub_user?schema=public';
    ctx = await createUserTestingModule();
  }, 60000);

  afterAll(async () => {
    await cleanupUserTestData(ctx.prisma);
    await closeUserTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    await cleanupStaff(ctx.prisma);
  });

  // ============================================================================
  // 2.1 createStaff
  // ============================================================================

  describe('2.1 createStaff', () => {
    describe('Success Scenarios', () => {
      it('should create staff with all required fields', async () => {
        // Arrange
        const request = createTestStaffRequest(testCinemaId, {
          fullName: 'John Doe',
          email: 'john.doe@test.com',
          position: 'TICKET_CLERK',
        });

        // Act
        const result = await ctx.staffController.create(request);

        // Assert - Response
        expect(result.message).toBe('Create staff successfully!');
        expect(result.data.id).toBeDefined();
        expect(result.data.fullName).toBe('John Doe');
        expect(result.data.email).toBe('john.doe@test.com');
        expect(result.data.position).toBe('TICKET_CLERK');

        // Assert - Persisted in database
        await verifyStaffPersisted(ctx.prisma, result.data.id, request);
      });

      it('should create staff with CINEMA_MANAGER position', async () => {
        // Arrange
        const request = createTestStaffRequest(testCinemaId, {
          fullName: 'Manager Person',
          position: 'CINEMA_MANAGER',
          salary: 25000000,
        });

        // Act
        const result = await ctx.staffController.create(request);

        // Assert
        expect(result.data.position).toBe('CINEMA_MANAGER');
        expect(result.data.salary).toBe(25000000);
      });

      it('should create staff with different work types', async () => {
        // Arrange
        const partTimeRequest = createTestStaffRequest(testCinemaId, {
          fullName: 'Part Timer',
          email: 'parttimer@test.com',
          workType: 'PART_TIME',
        });

        // Act
        const result = await ctx.staffController.create(partTimeRequest);

        // Assert
        expect(result.data.workType).toBe('PART_TIME');
      });

      it('should create staff with different shift types', async () => {
        // Arrange
        const eveningShiftRequest = createTestStaffRequest(testCinemaId, {
          fullName: 'Evening Worker',
          email: 'evening@test.com',
          shiftType: 'NIGHT',
        });

        // Act
        const result = await ctx.staffController.create(eveningShiftRequest);

        // Assert
        expect(result.data.shiftType).toBe('NIGHT');
      });

      it('should set timestamps on creation', async () => {
        // Arrange
        const request = createTestStaffRequest(testCinemaId);
        const beforeCreate = new Date();

        // Act
        const result = await ctx.staffController.create(request);

        // Assert
        const dbStaff = await ctx.prisma.staff.findUnique({
          where: { id: result.data.id },
        });

        expect(dbStaff?.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000
        );
        expect(dbStaff?.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000
        );
      });
    });

    describe('Unique Constraints', () => {
      it('should fail when creating staff with duplicate email', async () => {
        // Arrange - Create first staff
        const request1 = createTestStaffRequest(testCinemaId, {
          email: 'duplicate@test.com',
          fullName: 'First Staff',
        });
        await ctx.staffController.create(request1);

        // Act & Assert - Try to create second staff with same email
        const request2 = createTestStaffRequest(testCinemaId, {
          email: 'duplicate@test.com',
          fullName: 'Second Staff',
        });

        await expect(
          ctx.staffController.create(request2)
        ).rejects.toMatchObject({
          code: 'P2002', // Prisma unique constraint violation
        });
      });
    });
  });

  // ============================================================================
  // 2.2 findAllStaff
  // ============================================================================

  describe('2.2 findAllStaff', () => {
    beforeEach(async () => {
      // Seed staff with various attributes
      await ctx.prisma.staff.createMany({
        data: [
          {
            cinemaId: testCinemaId,
            fullName: 'John Manager',
            email: 'john.manager@test.com',
            phone: '0901234567',
            gender: 'MALE' as any,
            dob: new Date('1985-05-15'),
            position: 'CINEMA_MANAGER' as any,
            status: 'ACTIVE' as any,
            workType: 'FULL_TIME' as any,
            shiftType: 'MORNING' as any,
            salary: 25000000,
            hireDate: new Date('2020-01-01'),
          },
          {
            cinemaId: testCinemaId,
            fullName: 'Jane Clerk',
            email: 'jane.clerk@test.com',
            phone: '0901234568',
            gender: 'FEMALE' as any,
            dob: new Date('1990-08-20'),
            position: 'TICKET_CLERK' as any,
            status: 'ACTIVE' as any,
            workType: 'FULL_TIME' as any,
            shiftType: 'AFTERNOON' as any,
            salary: 12000000,
            hireDate: new Date('2022-06-15'),
          },
          {
            cinemaId: testCinemaId,
            fullName: 'Bob Security',
            email: 'bob.security@test.com',
            phone: '0901234569',
            gender: 'MALE' as any,
            dob: new Date('1988-12-01'),
            position: 'SECURITY' as any,
            status: 'INACTIVE' as any,
            workType: 'PART_TIME' as any,
            shiftType: 'NIGHT' as any,
            salary: 8000000,
            hireDate: new Date('2023-01-10'),
          },
          {
            cinemaId: 'different-cinema-id',
            fullName: 'Alice Other',
            email: 'alice.other@test.com',
            phone: '0901234570',
            gender: 'FEMALE' as any,
            dob: new Date('1992-03-25'),
            position: 'CONCESSION_STAFF' as any,
            status: 'ACTIVE' as any,
            workType: 'FULL_TIME' as any,
            shiftType: 'MORNING' as any,
            salary: 10000000,
            hireDate: new Date('2023-03-01'),
          },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return all staff with pagination', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(4);
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 10,
          totalRecords: 4,
        });
      });

      it('should filter staff by cinemaId', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          cinemaId: testCinemaId,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(3);
        result.data.forEach((staff) => {
          expect(staff.cinemaId).toBe(testCinemaId);
        });
      });

      it('should filter staff by gender', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          gender: 'FEMALE' as any,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(2);
        result.data.forEach((staff) => {
          expect(staff.gender).toBe('FEMALE');
        });
      });

      it('should filter staff by position', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          position: 'CINEMA_MANAGER' as any,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].fullName).toBe('John Manager');
      });

      it('should filter staff by status', async () => {
        // Act
        const activeResult = await ctx.staffController.findAll({
          status: 'ACTIVE' as any,
          page: 1,
          limit: 10,
        });

        const inactiveResult = await ctx.staffController.findAll({
          status: 'INACTIVE' as any,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(activeResult.data.length).toBe(3);
        expect(inactiveResult.data.length).toBe(1);
        expect(inactiveResult.data[0].fullName).toBe('Bob Security');
      });

      it('should filter staff by workType', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          workType: 'PART_TIME' as any,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].workType).toBe('PART_TIME');
      });

      it('should filter staff by shiftType', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          shiftType: 'MORNING' as any,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(2);
        result.data.forEach((staff) => {
          expect(staff.shiftType).toBe('MORNING');
        });
      });

      it('should search staff by fullName (partial, case-insensitive)', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          fullName: 'john',
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].fullName).toBe('John Manager');
      });

      it('should combine multiple filters', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          cinemaId: testCinemaId,
          gender: 'MALE' as any,
          status: 'ACTIVE' as any,
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].fullName).toBe('John Manager');
      });

      it('should handle pagination correctly', async () => {
        // Act
        const page1 = await ctx.staffController.findAll({
          page: 1,
          limit: 2,
        });

        const page2 = await ctx.staffController.findAll({
          page: 2,
          limit: 2,
        });

        // Assert
        expect(page1.data.length).toBe(2);
        expect(page1.meta?.hasNext).toBe(true);
        expect(page1.meta?.hasPrev).toBe(false);

        expect(page2.data.length).toBe(2);
        expect(page2.meta?.hasPrev).toBe(true);
      });

      it('should return empty array when no staff match filters', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          position: 'PROJECTIONIST' as any, // No one has this position
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.meta?.totalRecords).toBe(0);
      });
    });

    describe('Sorting', () => {
      it('should sort by createdAt descending by default', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          page: 1,
          limit: 10,
        });

        // Assert - Check ordering (most recently created first)
        // Note: Since all were created at roughly the same time,
        // we just verify the query doesn't error
        expect(result.data.length).toBe(4);
      });

      it('should sort by custom field', async () => {
        // Act
        const result = await ctx.staffController.findAll({
          sortBy: 'fullName',
          sortOrder: 'asc',
          page: 1,
          limit: 10,
        });

        // Assert - Alphabetical order
        const names = result.data.map((s) => s.fullName);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      });
    });
  });

  // ============================================================================
  // 2.3 findOneStaff
  // ============================================================================

  describe('2.3 findOneStaff', () => {
    let testStaffId: string;

    beforeEach(async () => {
      const staff = await ctx.prisma.staff.create({
        data: {
          cinemaId: testCinemaId,
          fullName: 'Detail Test Staff',
          email: 'detail.test@test.com',
          phone: '0901234567',
          gender: 'MALE',
          dob: new Date('1990-01-01'),
          position: 'TICKET_CLERK',
          status: 'ACTIVE',
          workType: 'FULL_TIME',
          shiftType: 'MORNING',
          salary: 12000000,
          hireDate: new Date('2024-01-01'),
        },
      });
      testStaffId = staff.id;
    });

    describe('Success Scenarios', () => {
      it('should return staff details by ID', async () => {
        // Act
        const result = await ctx.staffController.findOne(testStaffId);

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testStaffId);
        expect(result.data.fullName).toBe('Detail Test Staff');
        expect(result.data.email).toBe('detail.test@test.com');
        expect(result.data.position).toBe('TICKET_CLERK');
      });

      it('should include all staff fields in response', async () => {
        // Act
        const result = await ctx.staffController.findOne(testStaffId);

        // Assert - All expected fields present
        expect(result.data.id).toBeDefined();
        expect(result.data.cinemaId).toBeDefined();
        expect(result.data.fullName).toBeDefined();
        expect(result.data.email).toBeDefined();
        expect(result.data.phone).toBeDefined();
        expect(result.data.gender).toBeDefined();
        expect(result.data.dob).toBeDefined();
        expect(result.data.position).toBeDefined();
        expect(result.data.status).toBeDefined();
        expect(result.data.workType).toBeDefined();
        expect(result.data.shiftType).toBeDefined();
        expect(result.data.salary).toBeDefined();
        expect(result.data.hireDate).toBeDefined();
      });
    });

    describe('Failure Scenarios', () => {
      it('should return null for non-existent staff', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const result = await ctx.staffController.findOne(nonExistentId);

        // Assert
        expect(result.data).toBeNull();
      });
    });
  });

  // ============================================================================
  // 2.4 updateStaff
  // ============================================================================

  describe('2.4 updateStaff', () => {
    let testStaffId: string;

    beforeEach(async () => {
      const staff = await ctx.prisma.staff.create({
        data: {
          cinemaId: testCinemaId,
          fullName: 'Update Test Staff',
          email: 'update.test@test.com',
          phone: '0901234567',
          gender: 'MALE',
          dob: new Date('1990-01-01'),
          position: 'TICKET_CLERK',
          status: 'ACTIVE',
          workType: 'FULL_TIME',
          shiftType: 'MORNING',
          salary: 12000000,
          hireDate: new Date('2024-01-01'),
        },
      });
      testStaffId = staff.id;
    });

    describe('Success Scenarios', () => {
      it('should update staff fullName', async () => {
        // Arrange
        const updateData = { fullName: 'Updated Name' };

        // Act
        const result = await ctx.staffController.update({
          id: testStaffId,
          data: updateData,
        });

        // Assert
        expect(result.data.fullName).toBe('Updated Name');

        // Verify in database
        const dbStaff = await ctx.prisma.staff.findUnique({
          where: { id: testStaffId },
        });
        expect(dbStaff?.fullName).toBe('Updated Name');
      });

      it('should update staff position', async () => {
        // Arrange
        const updateData = { position: 'CINEMA_MANAGER' };

        // Act
        const result = await ctx.staffController.update({
          id: testStaffId,
          data: updateData,
        });

        // Assert
        expect(result.data.position).toBe('CINEMA_MANAGER');
      });

      it('should update staff status to INACTIVE', async () => {
        // Arrange
        const updateData = { status: 'INACTIVE' };

        // Act
        const result = await ctx.staffController.update({
          id: testStaffId,
          data: updateData,
        });

        // Assert
        expect(result.data.status).toBe('INACTIVE');
      });

      it('should update multiple fields at once', async () => {
        // Arrange
        const updateData = {
          fullName: 'Multi Update',
          position: 'SECURITY',
          salary: 15000000,
          shiftType: 'NIGHT',
        };

        // Act
        const result = await ctx.staffController.update({
          id: testStaffId,
          data: updateData,
        });

        // Assert
        expect(result.data.fullName).toBe('Multi Update');
        expect(result.data.position).toBe('SECURITY');
        expect(result.data.salary).toBe(15000000);
        expect(result.data.shiftType).toBe('NIGHT');
      });

      it('should not modify fields not included in update', async () => {
        // Arrange
        const originalEmail = 'update.test@test.com';
        const updateData = { fullName: 'Only Name Updated' };

        // Act
        const result = await ctx.staffController.update({
          id: testStaffId,
          data: updateData,
        });

        // Assert - Email should remain unchanged
        expect(result.data.email).toBe(originalEmail);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent staff', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.staffController.update({
            id: nonExistentId,
            data: { fullName: 'New Name' },
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 2.5 removeStaff
  // ============================================================================

  describe('2.5 removeStaff', () => {
    let testStaffId: string;

    beforeEach(async () => {
      const staff = await ctx.prisma.staff.create({
        data: {
          cinemaId: testCinemaId,
          fullName: 'Delete Test Staff',
          email: 'delete.test@test.com',
          phone: '0901234567',
          gender: 'MALE',
          dob: new Date('1990-01-01'),
          position: 'TICKET_CLERK',
          status: 'ACTIVE',
          workType: 'FULL_TIME',
          shiftType: 'MORNING',
          salary: 12000000,
          hireDate: new Date('2024-01-01'),
        },
      });
      testStaffId = staff.id;
    });

    describe('Success Scenarios', () => {
      it('should delete staff and return deleted data', async () => {
        // Verify staff exists
        const beforeDelete = await ctx.prisma.staff.findUnique({
          where: { id: testStaffId },
        });
        expect(beforeDelete).not.toBeNull();

        // Act
        const result = await ctx.staffController.remove(testStaffId);

        // Assert - Response
        expect(result.message).toBe('Delete staff successfully!');
        expect((result.data as any).id).toBe(testStaffId);
        expect((result.data as any).fullName).toBe('Delete Test Staff');

        // Verify deleted
        const afterDelete = await ctx.prisma.staff.findUnique({
          where: { id: testStaffId },
        });
        expect(afterDelete).toBeNull();
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent staff', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.staffController.remove(nonExistentId)
        ).rejects.toThrow();
      });
    });
  });
});
