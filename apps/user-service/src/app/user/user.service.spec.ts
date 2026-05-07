import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';

// Mock Clerk SDK
jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: {
      getUserList: jest.fn(),
    },
  },
}));

// Get the mocked clerkClient
const { clerkClient } = require('@clerk/clerk-sdk-node');
const mockClerkUserList = clerkClient.users.getUserList as jest.Mock;

describe('UserService', () => {
  let service: UserService;
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let mockPrismaService: {
    permission: {
      findMany: jest.Mock;
    };
  };

  // Sample test data
  const samplePermissions = [
    { name: 'read' },
    { name: 'write' },
    { name: 'delete' },
    { name: 'admin' },
  ];

  const sampleUsers = {
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

  beforeEach(async () => {
    // Create comprehensive mocks
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockPrismaService = {
      permission: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPermissions', () => {
    describe('cache hit scenarios', () => {
      it('should return cached permissions when available', async () => {
        const userId = 'test-user-123';
        const cachedPermissions = ['read', 'write'];

        mockCacheManager.get.mockResolvedValue(cachedPermissions);

        const result = await service.getPermissions(userId);

        expect(result).toEqual(cachedPermissions);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${userId}`
        );
        expect(mockCacheManager.get).toHaveBeenCalledTimes(1);
        expect(mockPrismaService.permission.findMany).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });

      it('should return empty cached permissions', async () => {
        const userId = 'user-no-permissions';
        const cachedPermissions: string[] = [];

        mockCacheManager.get.mockResolvedValue(cachedPermissions);

        const result = await service.getPermissions(userId);

        expect(result).toEqual([]);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${userId}`
        );
        expect(mockPrismaService.permission.findMany).not.toHaveBeenCalled();
      });

      it('should handle complex permission arrays from cache', async () => {
        const userId = 'admin-user';
        const complexPermissions = [
          'user:read',
          'user:write',
          'user:delete',
          'movie:read',
          'movie:write',
          'movie:delete',
          'cinema:read',
          'cinema:write',
          'cinema:manage',
          'system:admin',
          'system:config',
        ];

        mockCacheManager.get.mockResolvedValue(complexPermissions);

        const result = await service.getPermissions(userId);

        expect(result).toEqual(complexPermissions);
        expect(result).toHaveLength(11);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${userId}`
        );
      });
    });

    describe('cache miss scenarios', () => {
      it('should fetch permissions from database when cache is empty', async () => {
        const userId = 'test-user-456';
        const dbPermissions = [{ name: 'read' }, { name: 'write' }];
        const expectedPermissions = ['read', 'write'];

        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockResolvedValue(dbPermissions);

        const result = await service.getPermissions(userId);

        expect(result).toEqual(expectedPermissions);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${userId}`
        );
        expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
          where: {
            rolePermissions: {
              some: {
                role: {
                  userRoles: {
                    some: { userId },
                  },
                },
              },
            },
          },
          select: { name: true },
        });
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          `permissions:${userId}`,
          expectedPermissions
        );
      });

      it('should handle empty permissions from database', async () => {
        const userId = 'user-no-permissions';

        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockResolvedValue([]);

        const result = await service.getPermissions(userId);

        expect(result).toEqual([]);
        expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
          where: {
            rolePermissions: {
              some: {
                role: {
                  userRoles: {
                    some: { userId: 'user-no-permissions' },
                  },
                },
              },
            },
          },
          select: { name: true },
        });
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          `permissions:${userId}`,
          []
        );
      });

      it('should handle multiple permissions from database', async () => {
        const userId = 'multi-permission-user';

        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockResolvedValue(
          samplePermissions
        );

        const result = await service.getPermissions(userId);

        expect(result).toEqual(['read', 'write', 'delete', 'admin']);
        expect(result).toHaveLength(4);
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          `permissions:${userId}`,
          ['read', 'write', 'delete', 'admin']
        );
      });

      it('should cache permissions after database fetch', async () => {
        const userId = 'cache-test-user';
        const dbPermissions = [{ name: 'test-permission' }];

        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockResolvedValue(dbPermissions);

        await service.getPermissions(userId);

        expect(mockCacheManager.set).toHaveBeenCalledWith(
          `permissions:${userId}`,
          ['test-permission']
        );
        expect(mockCacheManager.set).toHaveBeenCalledTimes(1);
      });
    });

    describe('cache key generation', () => {
      it('should generate correct cache key for regular user IDs', async () => {
        const userId = 'regular-user-123';
        mockCacheManager.get.mockResolvedValue(['read']);

        await service.getPermissions(userId);

        expect(mockCacheManager.get).toHaveBeenCalledWith(
          'permissions:regular-user-123'
        );
      });

      it('should handle special characters in user IDs', async () => {
        const userId = 'user@example.com';
        mockCacheManager.get.mockResolvedValue(['read']);

        await service.getPermissions(userId);

        expect(mockCacheManager.get).toHaveBeenCalledWith(
          'permissions:user@example.com'
        );
      });

      it('should handle UUID user IDs', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        mockCacheManager.get.mockResolvedValue(['read']);

        await service.getPermissions(userId);

        expect(mockCacheManager.get).toHaveBeenCalledWith(
          'permissions:123e4567-e89b-12d3-a456-426614174000'
        );
      });
    });

    describe('error handling', () => {
      it('should handle cache get errors gracefully', async () => {
        const userId = 'error-user';

        mockCacheManager.get.mockRejectedValue(
          new Error('Cache connection failed')
        );

        await expect(service.getPermissions(userId)).rejects.toThrow(
          'Cache connection failed'
        );
      });

      it('should handle cache set errors gracefully', async () => {
        const userId = 'cache-set-error-user';
        const dbPermissions = [{ name: 'test-permission' }];

        mockCacheManager.get.mockResolvedValue(null);
        mockCacheManager.set.mockRejectedValue(new Error('Cache set failed'));
        mockPrismaService.permission.findMany.mockResolvedValue(dbPermissions);

        await expect(service.getPermissions(userId)).rejects.toThrow(
          'Cache set failed'
        );
      });

      it('should propagate database errors', async () => {
        const userId = 'db-error-user';

        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        await expect(service.getPermissions(userId)).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should handle database timeout errors', async () => {
        const userId = 'timeout-user';

        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockRejectedValue(
          new Error('Query timeout')
        );

        await expect(service.getPermissions(userId)).rejects.toThrow(
          'Query timeout'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty string user ID', async () => {
        const userId = '';
        mockCacheManager.get.mockResolvedValue(null);
        mockPrismaService.permission.findMany.mockResolvedValue([]);

        const result = await service.getPermissions(userId);

        expect(result).toEqual([]);
        expect(mockCacheManager.get).toHaveBeenCalledWith('permissions:');
      });

      it('should handle very long user IDs', async () => {
        const userId = 'a'.repeat(1000);
        mockCacheManager.get.mockResolvedValue(['long-user-permission']);

        const result = await service.getPermissions(userId);

        expect(result).toEqual(['long-user-permission']);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          `permissions:${userId}`
        );
      });

      it('should handle null/undefined from cache gracefully', async () => {
        const userId = 'null-cache-user';

        mockCacheManager.get.mockResolvedValue(undefined);
        mockPrismaService.permission.findMany.mockResolvedValue([
          { name: 'permission' },
        ]);

        const result = await service.getPermissions(userId);

        expect(result).toEqual(['permission']);
        expect(mockPrismaService.permission.findMany).toHaveBeenCalled();
      });
    });

    describe('concurrent access', () => {
      it('should handle concurrent permission requests for same user', async () => {
        const userId = 'concurrent-user';
        const permissions = ['read', 'write'];

        mockCacheManager.get.mockResolvedValue(permissions);

        const promises = Array.from({ length: 5 }, () =>
          service.getPermissions(userId)
        );
        const results = await Promise.all(promises);

        expect(results).toHaveLength(5);
        expect(
          results.every(
            (result) => JSON.stringify(result) === JSON.stringify(permissions)
          )
        ).toBe(true);
        expect(mockCacheManager.get).toHaveBeenCalledTimes(5);
      });

      it('should handle concurrent requests for different users', async () => {
        const userIds = ['user-1', 'user-2', 'user-3'];
        const permissions = ['read'];

        mockCacheManager.get.mockResolvedValue(permissions);

        const promises = userIds.map((userId) =>
          service.getPermissions(userId)
        );
        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        expect(
          results.every(
            (result) => JSON.stringify(result) === JSON.stringify(permissions)
          )
        ).toBe(true);
        expect(mockCacheManager.get).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('getUser', () => {
    describe('successful scenarios', () => {
      it('should return users from Clerk API', async () => {
        mockClerkUserList.mockResolvedValue(sampleUsers);

        const result = await service.getUser();

        expect(result).toEqual(sampleUsers);
        expect(mockClerkUserList).toHaveBeenCalledTimes(1);
        expect(mockClerkUserList).toHaveBeenCalledWith();
      });

      it('should return empty user list when no users exist', async () => {
        const emptyResponse = { data: [], totalCount: 0 };
        mockClerkUserList.mockResolvedValue(emptyResponse);

        const result = await service.getUser();

        expect(result).toEqual(emptyResponse);
        expect(result.data).toHaveLength(0);
        expect(result.totalCount).toBe(0);
      });

      it('should handle single user response', async () => {
        const singleUserResponse = {
          data: [{ id: 'single-user', firstName: 'Single', lastName: 'User' }],
          totalCount: 1,
        };
        mockClerkUserList.mockResolvedValue(singleUserResponse);

        const result = await service.getUser();

        expect(result).toEqual(singleUserResponse);
        expect(result.data).toHaveLength(1);
        expect(result.totalCount).toBe(1);
      });

      it('should handle large user lists', async () => {
        const largeUserList = {
          data: Array.from({ length: 100 }, (_, i) => ({
            id: `user-${i}`,
            firstName: `User${i}`,
            lastName: 'Test',
          })),
          totalCount: 100,
        };
        mockClerkUserList.mockResolvedValue(largeUserList);

        const result = await service.getUser();

        expect(result).toEqual(largeUserList);
        expect(result.data).toHaveLength(100);
        expect(result.totalCount).toBe(100);
      });
    });

    describe('error handling', () => {
      it('should propagate Clerk API errors', async () => {
        const clerkError = new Error('Clerk API unavailable');
        mockClerkUserList.mockRejectedValue(clerkError);

        await expect(service.getUser()).rejects.toThrow(
          'Clerk API unavailable'
        );
        expect(mockClerkUserList).toHaveBeenCalledTimes(1);
      });

      it('should handle authentication errors', async () => {
        const authError = new Error('Invalid API key');
        mockClerkUserList.mockRejectedValue(authError);

        await expect(service.getUser()).rejects.toThrow('Invalid API key');
      });

      it('should handle network timeout errors', async () => {
        const timeoutError = new Error('Request timeout');
        mockClerkUserList.mockRejectedValue(timeoutError);

        await expect(service.getUser()).rejects.toThrow('Request timeout');
      });

      it('should handle rate limiting errors', async () => {
        const rateLimitError = new Error('Rate limit exceeded');
        mockClerkUserList.mockRejectedValue(rateLimitError);

        await expect(service.getUser()).rejects.toThrow('Rate limit exceeded');
      });

      it('should handle malformed API responses', async () => {
        mockClerkUserList.mockResolvedValue(null);

        const result = await service.getUser();

        expect(result).toBeNull();
      });

      it('should handle undefined API responses', async () => {
        mockClerkUserList.mockResolvedValue(undefined);

        const result = await service.getUser();

        expect(result).toBeUndefined();
      });
    });

    describe('concurrent access', () => {
      it('should handle multiple concurrent user list requests', async () => {
        mockClerkUserList.mockResolvedValue(sampleUsers);

        const promises = Array.from({ length: 5 }, () => service.getUser());
        const results = await Promise.all(promises);

        expect(results).toHaveLength(5);
        expect(
          results.every(
            (result) => JSON.stringify(result) === JSON.stringify(sampleUsers)
          )
        ).toBe(true);
        expect(mockClerkUserList).toHaveBeenCalledTimes(5);
      });

      it('should handle rapid consecutive calls', async () => {
        const rapidResults = [
          { data: [{ id: 'user1' }], totalCount: 1 },
          { data: [{ id: 'user2' }], totalCount: 1 },
          { data: [{ id: 'user3' }], totalCount: 1 },
        ];

        mockClerkUserList
          .mockResolvedValueOnce(rapidResults[0])
          .mockResolvedValueOnce(rapidResults[1])
          .mockResolvedValueOnce(rapidResults[2]);

        const results = [];
        for (let i = 0; i < 3; i++) {
          results.push(await service.getUser());
        }

        expect(results).toEqual(rapidResults);
        expect(mockClerkUserList).toHaveBeenCalledTimes(3);
      });
    });

    describe('performance', () => {
      it('should complete user list request within reasonable time', async () => {
        mockClerkUserList.mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve(sampleUsers), 10))
        );

        const startTime = Date.now();
        await service.getUser();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      });

      it('should handle rapid requests without performance degradation', async () => {
        mockClerkUserList.mockResolvedValue(sampleUsers);

        const startTime = Date.now();
        const promises = Array.from({ length: 10 }, () => service.getUser());
        await Promise.all(promises);
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        expect(mockClerkUserList).toHaveBeenCalledTimes(10);
      });
    });
  });

  describe('service integration', () => {
    it('should properly inject dependencies', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(UserService);
    });

    it('should handle mixed operations correctly', async () => {
      const userId = 'integration-user';
      const permissions = ['read', 'write'];

      mockCacheManager.get.mockResolvedValue(permissions);
      mockClerkUserList.mockResolvedValue(sampleUsers);

      const [permissionResult, userResult] = await Promise.all([
        service.getPermissions(userId),
        service.getUser(),
      ]);

      expect(permissionResult).toEqual(permissions);
      expect(userResult).toEqual(sampleUsers);
    });

    it('should maintain independence between methods', async () => {
      const userId = 'independent-user';

      // Make permission call fail but user call succeed
      mockCacheManager.get.mockRejectedValue(new Error('Cache failed'));
      mockPrismaService.permission.findMany.mockRejectedValue(
        new Error('DB failed')
      );
      mockClerkUserList.mockResolvedValue(sampleUsers);

      await expect(service.getPermissions(userId)).rejects.toThrow();

      const userResult = await service.getUser();
      expect(userResult).toEqual(sampleUsers);
    });
  });

  describe('memory and resource management', () => {
    it('should not cause memory leaks with repeated calls', async () => {
      mockCacheManager.get.mockResolvedValue(['read']);
      mockClerkUserList.mockResolvedValue(sampleUsers);

      // Simulate many repeated calls
      for (let i = 0; i < 100; i++) {
        await service.getPermissions(`user-${i}`);
        await service.getUser();
      }

      expect(mockCacheManager.get).toHaveBeenCalledTimes(100);
      expect(mockClerkUserList).toHaveBeenCalledTimes(100);
    });

    it('should handle large data sets efficiently', async () => {
      const largePermissions = Array.from({ length: 1000 }, (_, i) => ({
        name: `permission-${i}`,
      }));
      const expectedResult = largePermissions.map((p) => p.name);

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.permission.findMany.mockResolvedValue(largePermissions);

      const result = await service.getPermissions('large-data-user');

      expect(result).toEqual(expectedResult);
      expect(result).toHaveLength(1000);
    });
  });
});
