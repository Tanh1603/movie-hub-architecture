/**
 * User Module Integration Tests
 *
 * Tests the User operations:
 * - getPermissions (with cache hit/miss testing)
 * - getUser (list from Clerk)
 * - getUserDetail
 * - findSettingVariables
 * - updateSettingVariable
 *
 * Key Test Focus:
 * - Cache Hit: Returns permissions from cache (DB not called)
 * - Cache Miss: Queries DB, returns permissions, sets cache
 * - Clerk API mocking for external service isolation
 *
 * @see test/docs/USER_SERVICE_INTEGRATION_TEST_DOCS.md Section 1
 */

import {
  UserTestContext,
  createUserTestingModule,
  cleanupUserTestData,
  closeUserTestContext,
  seedRolesAndPermissions,
  seedSettingVariable,
  cleanupRolesAndPermissions,
} from './helpers/user-test-helpers';

describe('User Module Integration Tests', () => {
  let ctx: UserTestContext;

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
    await cleanupRolesAndPermissions(ctx.prisma);
    ctx.mockCacheManager._clearCache();
    ctx.mockCacheManager.get.mockClear();
    ctx.mockCacheManager.set.mockClear();
  });

  // ============================================================================
  // 1.1 getPermissions
  // ============================================================================

  describe('1.1 getPermissions', () => {
    const testUserId = 'test-user-id';

    describe('Success Scenarios', () => {
      it('should return permissions from database on cache miss', async () => {
        // Arrange - Seed roles and permissions
        await seedRolesAndPermissions(ctx.prisma, testUserId);

        // Act
        const result = await ctx.userController.getPermissions({
          userId: testUserId,
        });

        // Assert - Should return permissions
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(4); // READ_USERS, WRITE_USERS, DELETE_USERS, MANAGE_STAFF
        expect(result).toContain('READ_USERS');
        expect(result).toContain('WRITE_USERS');
        expect(result).toContain('DELETE_USERS');
        expect(result).toContain('MANAGE_STAFF');

        // Assert - Cache was checked (miss) and then set
        expect(ctx.mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${testUserId}`
        );
        expect(ctx.mockCacheManager.set).toHaveBeenCalledWith(
          `permissions:${testUserId}`,
          expect.arrayContaining(['READ_USERS', 'WRITE_USERS'])
        );
      });

      it('should return permissions from cache on cache hit (no DB call)', async () => {
        // Arrange - Pre-populate cache
        const cachedPermissions = [
          'CACHED_PERMISSION_1',
          'CACHED_PERMISSION_2',
        ];
        ctx.mockCacheManager.get.mockResolvedValueOnce(cachedPermissions);

        // Act
        const result = await ctx.userController.getPermissions({
          userId: testUserId,
        });

        // Assert - Should return cached permissions
        expect(result).toEqual(cachedPermissions);

        // Assert - Cache get was called but set was NOT called (since cache hit)
        expect(ctx.mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${testUserId}`
        );
        expect(ctx.mockCacheManager.set).not.toHaveBeenCalled();
      });

      it('should return empty array when user has no roles', async () => {
        // Arrange - User exists but has no roles assigned

        // Act
        const result = await ctx.userController.getPermissions({
          userId: 'user-without-roles',
        });

        // Assert
        expect(result).toEqual([]);

        // Cache should still be set (even if empty)
        expect(ctx.mockCacheManager.set).toHaveBeenCalledWith(
          'permissions:user-without-roles',
          []
        );
      });

      it('should return permissions for user with multiple roles', async () => {
        // Arrange - Create two roles with different permissions
        const permission1 = await ctx.prisma.permission.create({
          data: { name: 'ROLE1_PERMISSION' },
        });
        const permission2 = await ctx.prisma.permission.create({
          data: { name: 'ROLE2_PERMISSION' },
        });
        const permission3 = await ctx.prisma.permission.create({
          data: { name: 'SHARED_PERMISSION' },
        });

        const role1 = await ctx.prisma.role.create({
          data: { name: 'ROLE_ONE' },
        });
        const role2 = await ctx.prisma.role.create({
          data: { name: 'ROLE_TWO' },
        });

        // Link permissions to roles
        await ctx.prisma.rolePermission.createMany({
          data: [
            { roleId: role1.id, permissionId: permission1.id },
            { roleId: role1.id, permissionId: permission3.id },
            { roleId: role2.id, permissionId: permission2.id },
            { roleId: role2.id, permissionId: permission3.id },
          ],
        });

        // Assign both roles to user
        const multiRoleUserId = 'multi-role-user';
        await ctx.prisma.userRole.createMany({
          data: [
            { userId: multiRoleUserId, roleId: role1.id },
            { userId: multiRoleUserId, roleId: role2.id },
          ],
        });

        // Act
        const result = await ctx.userController.getPermissions({
          userId: multiRoleUserId,
        });

        // Assert - Should return unique permissions from all roles
        expect(result.length).toBe(3);
        expect(result).toContain('ROLE1_PERMISSION');
        expect(result).toContain('ROLE2_PERMISSION');
        expect(result).toContain('SHARED_PERMISSION');
      });
    });

    describe('Cache Behavior', () => {
      it('should use correct cache key format', async () => {
        // Act
        await ctx.userController.getPermissions({
          userId: 'specific-user-123',
        });

        // Assert
        expect(ctx.mockCacheManager.get).toHaveBeenCalledWith(
          'permissions:specific-user-123'
        );
      });

      it('should cache permissions after fetching from database', async () => {
        // Arrange
        await seedRolesAndPermissions(ctx.prisma, testUserId);

        // Act
        await ctx.userController.getPermissions({ userId: testUserId });

        // Assert - Cache should contain the permissions
        const cachedValue = ctx.mockCacheManager
          ._getCache()
          .get(`permissions:${testUserId}`);
        expect(cachedValue).toBeDefined();
        expect(cachedValue).toBeInstanceOf(Array);
        expect(cachedValue.length).toBe(4);
      });

      it('should not query database when cache is populated', async () => {
        // Arrange - Set cache with specific permissions
        ctx.mockCacheManager.get.mockResolvedValueOnce(['CACHED_ONLY']);

        // Seed DB with different permissions
        await seedRolesAndPermissions(ctx.prisma, testUserId);

        // Act
        const result = await ctx.userController.getPermissions({
          userId: testUserId,
        });

        // Assert - Should return cached value, not DB value
        expect(result).toEqual(['CACHED_ONLY']);
      });
    });
  });

  // ============================================================================
  // 1.2 getUser (List)
  // ============================================================================

  describe('1.2 getUser (List)', () => {
    // Note: This endpoint calls Clerk directly, which is mocked
    // In a real integration test, this would verify the Clerk response mapping

    describe('Success Scenarios', () => {
      it('should return list of users from Clerk', async () => {
        // Note: Since clerkClient is imported at module load time,
        // we test that the service correctly calls and returns data
        // The actual Clerk call is mocked in the helpers

        // This test verifies the endpoint returns data
        // The mock returns predefined users
        const result = await ctx.userController.getUser();

        // Assert - Result should be defined (actual structure depends on Clerk SDK)
        expect(result).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 1.3 getUserDetail
  // ============================================================================

  describe('1.3 getUserDetail', () => {
    describe('Success Scenarios', () => {
      it('should return mapped user profile for valid user ID', async () => {
        // Arrange
        const userId = 'valid_user_123';

        // Act
        const result = await ctx.userController.getUserDetail(userId);

        // Assert - Should return mapped user profile
        expect(result).toBeDefined();
        expect(result.id).toBe(userId);
        expect(result.email).toBeDefined();
        expect(result.firstName).toBeDefined();
        expect(result.lastName).toBeDefined();
        expect(result.fullName).toBeDefined();
        expect(result.imageUrl).toBeDefined();
      });

      it('should construct fullName from firstName and lastName', async () => {
        // Act
        const result = await ctx.userController.getUserDetail('user_test');

        // Assert
        expect(result.fullName).toBe('Mock User');
      });
    });

    describe('Error Handling', () => {
      it('should handle Clerk error for non-existent user', async () => {
        // Arrange - Use special userId that triggers error in mock

        // Act & Assert
        await expect(
          ctx.userController.getUserDetail('user_not_found')
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 1.4 findSettingVariables
  // ============================================================================

  describe('1.4 findSettingVariables', () => {
    beforeEach(async () => {
      // Seed some settings
      await seedSettingVariable(ctx.prisma, 'SITE_NAME', {
        value: 'Movie Hub',
      });
      await seedSettingVariable(ctx.prisma, 'MAX_SEATS_PER_BOOKING', {
        value: 8,
      });
      await seedSettingVariable(ctx.prisma, 'BOOKING_TIMEOUT_MINUTES', {
        value: 15,
      });
    });

    describe('Success Scenarios', () => {
      it('should return all setting variables', async () => {
        // Act
        const result = await ctx.userController.findSettingVariables();

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.length).toBeGreaterThanOrEqual(3);

        const keys = result.data.map((s) => s.key);
        expect(keys).toContain('SITE_NAME');
        expect(keys).toContain('MAX_SEATS_PER_BOOKING');
      });

      it('should include key, value, and description for each setting', async () => {
        // Arrange - Create setting with description
        await seedSettingVariable(
          ctx.prisma,
          'SETTING_WITH_DESC',
          { enabled: true },
          'Test setting description'
        );

        // Act
        const result = await ctx.userController.findSettingVariables();

        // Assert
        const settingWithDesc = result.data.find(
          (s) => s.key === 'SETTING_WITH_DESC'
        );
        expect(settingWithDesc).toBeDefined();
        expect(settingWithDesc?.description).toBe('Test setting description');
        expect(settingWithDesc?.value).toEqual({ enabled: true });
      });
    });
  });

  // ============================================================================
  // 1.5 updateSettingVariable
  // ============================================================================

  describe('1.5 updateSettingVariable', () => {
    beforeEach(async () => {
      await seedSettingVariable(ctx.prisma, 'UPDATE_TEST_KEY', {
        original: true,
      });
    });

    describe('Success Scenarios', () => {
      it('should update setting value', async () => {
        // Arrange
        const updateData = {
          key: 'UPDATE_TEST_KEY',
          value: { updated: true, newField: 'newValue' },
        };

        // Act
        const result = await ctx.userController.updateSettingVariable(
          updateData
        );

        // Assert
        expect(result.message).toBe('Update setting variable successfully!');
        expect(result.data.value).toEqual({
          updated: true,
          newField: 'newValue',
        });

        // Verify in database
        const dbSetting = await ctx.prisma.setting.findUnique({
          where: { key: 'UPDATE_TEST_KEY' },
        });
        expect(dbSetting?.value).toEqual({
          updated: true,
          newField: 'newValue',
        });
      });

      it('should update setting description', async () => {
        // Arrange
        const updateData = {
          key: 'UPDATE_TEST_KEY',
          value: { original: true },
          description: 'Updated description',
        };

        // Act
        const result = await ctx.userController.updateSettingVariable(
          updateData
        );

        // Assert
        expect(result.data.description).toBe('Updated description');

        // Verify in database
        const dbSetting = await ctx.prisma.setting.findUnique({
          where: { key: 'UPDATE_TEST_KEY' },
        });
        expect(dbSetting?.description).toBe('Updated description');
      });

      it('should update both value and description at once', async () => {
        // Arrange
        const updateData = {
          key: 'UPDATE_TEST_KEY',
          value: { completely: 'new' },
          description: 'Completely new description',
        };

        // Act
        const result = await ctx.userController.updateSettingVariable(
          updateData
        );

        // Assert
        expect(result.data.value).toEqual({ completely: 'new' });
        expect(result.data.description).toBe('Completely new description');
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent setting key', async () => {
        // Arrange
        const updateData = {
          key: 'NON_EXISTENT_KEY',
          value: { test: true },
        };

        // Act & Assert
        await expect(
          ctx.userController.updateSettingVariable(updateData)
        ).rejects.toThrow();
      });
    });
  });
});
