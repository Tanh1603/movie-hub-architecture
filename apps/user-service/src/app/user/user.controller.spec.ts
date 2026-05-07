import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    // Create mocked service
    mockUserService = {
      getPermissions: jest.fn(),
      getUser: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPermissions', () => {
    const mockData = { userId: 'user-123' };

    it('should return permissions from service', async () => {
      const expectedPermissions = ['read', 'write', 'admin'];
      mockUserService.getPermissions.mockResolvedValue(expectedPermissions);

      const result = await controller.getPermissions(mockData);

      expect(result).toEqual(expectedPermissions);
      expect(mockUserService.getPermissions).toHaveBeenCalledWith(
        mockData.userId
      );
      expect(mockUserService.getPermissions).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no permissions', async () => {
      mockUserService.getPermissions.mockResolvedValue([]);

      const result = await controller.getPermissions(mockData);

      expect(result).toEqual([]);
      expect(mockUserService.getPermissions).toHaveBeenCalledWith(
        mockData.userId
      );
    });

    it('should handle different user IDs', async () => {
      const testCases = [
        { userId: 'user-123', permissions: ['read', 'write'] },
        { userId: 'user-456', permissions: ['admin'] },
        { userId: 'user-789', permissions: [] },
        {
          userId: 'admin-user',
          permissions: ['read', 'write', 'admin', 'super-admin'],
        },
      ];

      for (const testCase of testCases) {
        mockUserService.getPermissions.mockResolvedValue(testCase.permissions);

        const result = await controller.getPermissions({
          userId: testCase.userId,
        });

        expect(result).toEqual(testCase.permissions);
        expect(mockUserService.getPermissions).toHaveBeenCalledWith(
          testCase.userId
        );
      }

      expect(mockUserService.getPermissions).toHaveBeenCalledTimes(
        testCases.length
      );
    });

    it('should handle special characters in user IDs', async () => {
      const specialUserIds = [
        'user-with-dashes',
        'user_with_underscores',
        'user.with.dots',
        'user@email.com',
        'user+tag@example.com',
        'user%20with%20encoding',
      ];

      for (const userId of specialUserIds) {
        const expectedPermissions = ['read'];
        mockUserService.getPermissions.mockResolvedValue(expectedPermissions);

        const result = await controller.getPermissions({ userId });

        expect(result).toEqual(expectedPermissions);
        expect(mockUserService.getPermissions).toHaveBeenCalledWith(userId);
      }
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Database connection failed');
      mockUserService.getPermissions.mockRejectedValue(serviceError);

      await expect(controller.getPermissions(mockData)).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockUserService.getPermissions).toHaveBeenCalledWith(
        mockData.userId
      );
    });

    it('should handle timeout errors from service', async () => {
      const timeoutError = new Error('Request timeout');
      mockUserService.getPermissions.mockRejectedValue(timeoutError);

      await expect(controller.getPermissions(mockData)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle cache service errors', async () => {
      const cacheError = new Error('Cache service unavailable');
      mockUserService.getPermissions.mockRejectedValue(cacheError);

      await expect(controller.getPermissions(mockData)).rejects.toThrow(
        'Cache service unavailable'
      );
    });

    it('should handle async operation correctly', async () => {
      const permissions = ['read', 'write'];

      // Test that the controller properly awaits the service promise
      let resolveService: (value: string[]) => void;
      const servicePromise = new Promise<string[]>((resolve) => {
        resolveService = resolve;
      });

      mockUserService.getPermissions.mockReturnValue(servicePromise);

      const controllerPromise = controller.getPermissions(mockData);

      // Resolve the service promise after a delay
      setTimeout(() => resolveService(permissions), 100);

      const result = await controllerPromise;
      expect(result).toEqual(permissions);
    });

    it('should handle null/undefined userId gracefully', async () => {
      const nullData = { userId: null as unknown as string };
      const undefinedData = { userId: undefined as unknown as string };

      mockUserService.getPermissions.mockResolvedValue([]);

      // Test null userId
      const resultNull = await controller.getPermissions(nullData);
      expect(resultNull).toEqual([]);
      expect(mockUserService.getPermissions).toHaveBeenCalledWith(null);

      // Test undefined userId
      const resultUndefined = await controller.getPermissions(undefinedData);
      expect(resultUndefined).toEqual([]);
      expect(mockUserService.getPermissions).toHaveBeenCalledWith(undefined);
    });

    it('should handle large permission arrays', async () => {
      const largePermissionArray = Array.from(
        { length: 1000 },
        (_, i) => `permission-${i}`
      );
      mockUserService.getPermissions.mockResolvedValue(largePermissionArray);

      const result = await controller.getPermissions(mockData);

      expect(result).toEqual(largePermissionArray);
      expect(result.length).toBe(1000);
    });
  });

  describe('getUser', () => {
    it('should return users from service', async () => {
      // Mock Clerk's PaginatedResourceResponse format
      const expectedUsers = {
        data: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            emailAddresses: [{ emailAddress: 'john@example.com' }],
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            emailAddresses: [{ emailAddress: 'jane@example.com' }],
          },
        ],
        totalCount: 2,
      };
      mockUserService.getUser.mockResolvedValue(
        expectedUsers as unknown as ReturnType<typeof mockUserService.getUser>
      );

      const result = await controller.getUser();

      expect(result).toEqual(expectedUsers);
      expect(mockUserService.getUser).toHaveBeenCalledTimes(1);
      expect(mockUserService.getUser).toHaveBeenCalledWith();
    });

    it('should return empty data when no users exist', async () => {
      const emptyResponse = { data: [], totalCount: 0 };
      mockUserService.getUser.mockResolvedValue(
        emptyResponse as unknown as ReturnType<typeof mockUserService.getUser>
      );

      const result = await controller.getUser();

      expect(result).toEqual(emptyResponse);
      expect(mockUserService.getUser).toHaveBeenCalledTimes(1);
    });

    it('should handle single user response', async () => {
      const singleUserResponse = {
        data: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            emailAddresses: [{ emailAddress: 'john@example.com' }],
          },
        ],
        totalCount: 1,
      };
      mockUserService.getUser.mockResolvedValue(
        singleUserResponse as unknown as ReturnType<
          typeof mockUserService.getUser
        >
      );

      const result = await controller.getUser();

      expect(result).toEqual(singleUserResponse);
      expect((result as unknown as typeof singleUserResponse).data.length).toBe(
        1
      );
    });

    it('should handle large user lists', async () => {
      const largeUserResponse = {
        data: Array.from({ length: 500 }, (_, i) => ({
          id: `user-${i}`,
          firstName: `User${i}`,
          lastName: `LastName${i}`,
          emailAddresses: [{ emailAddress: `user${i}@example.com` }],
        })),
        totalCount: 500,
      };
      mockUserService.getUser.mockResolvedValue(
        largeUserResponse as unknown as ReturnType<
          typeof mockUserService.getUser
        >
      );

      const result = await controller.getUser();

      expect(result).toEqual(largeUserResponse);
      expect((result as unknown as typeof largeUserResponse).data.length).toBe(
        500
      );
    });

    it('should propagate Clerk API errors', async () => {
      const clerkError = new Error('Clerk API rate limit exceeded');
      mockUserService.getUser.mockRejectedValue(clerkError);

      await expect(controller.getUser()).rejects.toThrow(
        'Clerk API rate limit exceeded'
      );

      expect(mockUserService.getUser).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockUserService.getUser.mockRejectedValue(networkError);

      await expect(controller.getUser()).rejects.toThrow(
        'Network connection failed'
      );
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid Clerk API key');
      mockUserService.getUser.mockRejectedValue(authError);

      await expect(controller.getUser()).rejects.toThrow(
        'Invalid Clerk API key'
      );
    });

    it('should handle async operation correctly', async () => {
      const users = {
        data: [{ id: 'user-1', firstName: 'John' }],
        totalCount: 1,
      };

      // Test that the controller properly handles async operations
      let resolveService: (value: typeof users) => void;
      const servicePromise = new Promise<typeof users>((resolve) => {
        resolveService = resolve;
      });

      mockUserService.getUser.mockReturnValue(
        servicePromise as ReturnType<typeof mockUserService.getUser>
      );

      const controllerPromise = controller.getUser();

      // Resolve the service promise after a delay
      setTimeout(() => resolveService(users), 100);

      const result = await controllerPromise;
      expect(result).toEqual(users);
    });

    it('should handle undefined/null response from service', async () => {
      mockUserService.getUser.mockResolvedValue(
        null as unknown as ReturnType<typeof mockUserService.getUser>
      );

      const result = await controller.getUser();

      expect(result).toBeNull();
      expect(mockUserService.getUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle service unavailable errors for both methods', async () => {
      const unavailableError = new Error('Service temporarily unavailable');

      mockUserService.getPermissions.mockRejectedValue(unavailableError);
      mockUserService.getUser.mockRejectedValue(unavailableError);

      await expect(
        controller.getPermissions({ userId: 'user-123' })
      ).rejects.toThrow('Service temporarily unavailable');

      await expect(controller.getUser()).rejects.toThrow(
        'Service temporarily unavailable'
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid user ID format');
      mockUserService.getPermissions.mockRejectedValue(validationError);

      await expect(
        controller.getPermissions({ userId: 'invalid-id' })
      ).rejects.toThrow('Invalid user ID format');
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection timeout');
      mockUserService.getPermissions.mockRejectedValue(dbError);

      await expect(
        controller.getPermissions({ userId: 'user-123' })
      ).rejects.toThrow('Database connection timeout');
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent permission requests', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      const expectedPermissions = ['read', 'write'];

      mockUserService.getPermissions.mockResolvedValue(expectedPermissions);

      const promises = userIds.map((userId) =>
        controller.getPermissions({ userId })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(
        results.every(
          (result) =>
            JSON.stringify(result) === JSON.stringify(expectedPermissions)
        )
      ).toBe(true);
      expect(mockUserService.getPermissions).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent user list requests', async () => {
      const mockUsers = {
        data: [{ id: 'user-1', firstName: 'John' }],
        totalCount: 1,
      };
      mockUserService.getUser.mockResolvedValue(
        mockUsers as unknown as ReturnType<typeof mockUserService.getUser>
      );

      const promises = Array.from({ length: 3 }, () => controller.getUser());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(
        results.every(
          (result) => JSON.stringify(result) === JSON.stringify(mockUsers)
        )
      ).toBe(true);
      expect(mockUserService.getUser).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed concurrent requests', async () => {
      const permissions = ['read'];
      const users = { data: [{ id: 'user-1' }], totalCount: 1 };

      mockUserService.getPermissions.mockResolvedValue(permissions);
      mockUserService.getUser.mockResolvedValue(
        users as unknown as ReturnType<typeof mockUserService.getUser>
      );

      const promises = [
        controller.getPermissions({ userId: 'user-1' }),
        controller.getUser(),
        controller.getPermissions({ userId: 'user-2' }),
        controller.getUser(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual(permissions);
      expect(results[1]).toEqual(users);
      expect(results[2]).toEqual(permissions);
      expect(results[3]).toEqual(users);
    });
  });

  describe('message pattern integration', () => {
    it('should be properly decorated with MessagePattern for getPermissions', () => {
      // This test verifies that the method exists and can be called
      // The actual MessagePattern decorator testing would require integration tests
      expect(controller.getPermissions).toBeDefined();
      expect(typeof controller.getPermissions).toBe('function');
    });

    it('should be properly decorated with MessagePattern for getUser', () => {
      // This test verifies that the method exists and can be called
      // The actual MessagePattern decorator testing would require integration tests
      expect(controller.getUser).toBeDefined();
      expect(typeof controller.getUser).toBe('function');
    });

    it('should handle payload structure correctly for getPermissions', async () => {
      // Test that the controller accepts the expected payload structure
      const validPayload = { userId: 'user-123' };
      mockUserService.getPermissions.mockResolvedValue(['read']);

      // This should not throw any errors related to payload structure
      await controller.getPermissions(validPayload);

      expect(mockUserService.getPermissions).toHaveBeenCalledWith(
        validPayload.userId
      );
    });

    it('should work without payload for getUser', async () => {
      // Test that getUser doesn't require any payload
      const emptyResponse = { data: [], totalCount: 0 };
      mockUserService.getUser.mockResolvedValue(
        emptyResponse as unknown as ReturnType<typeof mockUserService.getUser>
      );

      // This should not throw any errors
      await controller.getUser();

      expect(mockUserService.getUser).toHaveBeenCalledWith();
    });
  });

  describe('performance', () => {
    it('should handle high-frequency permission requests', async () => {
      const startTime = Date.now();
      mockUserService.getPermissions.mockResolvedValue(['read']);

      // Simulate 100 rapid requests
      const promises = Array.from({ length: 100 }, () =>
        controller.getPermissions({ userId: 'user-123' })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockUserService.getPermissions).toHaveBeenCalledTimes(100);
    });

    it('should handle rapid user list requests', async () => {
      const startTime = Date.now();
      const emptyResponse = { data: [], totalCount: 0 };
      mockUserService.getUser.mockResolvedValue(
        emptyResponse as unknown as ReturnType<typeof mockUserService.getUser>
      );

      // Simulate 50 rapid requests
      const promises = Array.from({ length: 50 }, () => controller.getUser());

      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockUserService.getUser).toHaveBeenCalledTimes(50);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string userId', async () => {
      mockUserService.getPermissions.mockResolvedValue([]);

      const result = await controller.getPermissions({ userId: '' });

      expect(result).toEqual([]);
      expect(mockUserService.getPermissions).toHaveBeenCalledWith('');
    });

    it('should handle very long userId', async () => {
      const longUserId = 'a'.repeat(1000);
      mockUserService.getPermissions.mockResolvedValue(['read']);

      const result = await controller.getPermissions({ userId: longUserId });

      expect(result).toEqual(['read']);
      expect(mockUserService.getPermissions).toHaveBeenCalledWith(longUserId);
    });

    it('should handle service returning undefined', async () => {
      mockUserService.getPermissions.mockResolvedValue(
        undefined as unknown as string[]
      );

      const result = await controller.getPermissions({ userId: 'user-123' });

      expect(result).toBeUndefined();
    });
  });
});
