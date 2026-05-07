/**
 * User Service Integration Test Helpers
 *
 * This file provides utilities for setting up and tearing down integration tests
 * for the user-service microservice.
 *
 * Key principles:
 * - Use REAL PostgreSQL database (no mocking of PrismaService)
 * - Mock external services (Clerk API via clerkClient)
 * - Mock cache manager for cache hit/miss testing
 * - Inject controllers directly for TCP microservice testing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../../apps/user-service/src/app/prisma.service';
import { UserController } from '../../../../apps/user-service/src/app/user/user.controller';
import { UserService } from '../../../../apps/user-service/src/app/user/user.service';
import { StaffController } from '../../../../apps/user-service/src/app/staff/staff.controller';
import { StaffService } from '../../../../apps/user-service/src/app/staff/staff.service';
import { ConfigModule } from '@nestjs/config';

// ============================================================================
// MOCK PROVIDERS
// ============================================================================

/**
 * Mock for Clerk Client (External API)
 * Used for mocking user authentication and identity management
 */
export const createMockClerkClient = () => ({
  users: {
    getUserList: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'user_mock_1',
          emailAddresses: [{ emailAddress: 'user1@example.com' }],
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phoneNumbers: [{ phoneNumber: '+84901234567' }],
          imageUrl: 'https://example.com/avatar.jpg',
        },
        {
          id: 'user_mock_2',
          emailAddresses: [{ emailAddress: 'user2@example.com' }],
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith',
          phoneNumbers: [],
          imageUrl: 'https://example.com/avatar2.jpg',
        },
      ],
    }),
    getUser: jest.fn().mockImplementation((userId: string) => {
      if (userId === 'user_not_found') {
        throw new Error('User not found');
      }
      return Promise.resolve({
        id: userId,
        emailAddresses: [{ emailAddress: `${userId}@example.com` }],
        firstName: 'Mock',
        lastName: 'User',
        username: 'mockuser',
        phoneNumbers: [{ phoneNumber: '+84901234567' }],
        imageUrl: 'https://example.com/avatar.jpg',
      });
    }),
  },
});

/**
 * Mock for Cache Manager (Redis)
 * Used for testing cache hit/miss scenarios
 */
export const createMockCacheManager = () => {
  const cache = new Map<string, any>();
  return {
    get: jest
      .fn()
      .mockImplementation((key: string) => Promise.resolve(cache.get(key))),
    set: jest.fn().mockImplementation((key: string, value: any) => {
      cache.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn().mockImplementation((key: string) => {
      cache.delete(key);
      return Promise.resolve();
    }),
    reset: jest.fn().mockImplementation(() => {
      cache.clear();
      return Promise.resolve();
    }),
    // Expose internal cache for test assertions
    _getCache: () => cache,
    _clearCache: () => cache.clear(),
  };
};

export type MockCacheManager = ReturnType<typeof createMockCacheManager>;

// ============================================================================
// TEST MODULE BUILDER
// ============================================================================

export interface UserTestContext {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
  userController: UserController;
  staffController: StaffController;
  mockClerkClient: ReturnType<typeof createMockClerkClient>;
  mockCacheManager: MockCacheManager;
}

/**
 * Creates a testing module for user-service integration tests
 * - Uses real PrismaService for database operations
 * - Mocks Clerk API for identity management
 * - Mocks Cache Manager for cache hit/miss testing
 */
export async function createUserTestingModule(): Promise<UserTestContext> {
  const mockClerkClient = createMockClerkClient();
  const mockCacheManager = createMockCacheManager();

  // Mock the clerkClient module before importing
  jest.mock('@clerk/clerk-sdk-node', () => ({
    clerkClient: mockClerkClient,
  }));

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.test', '.env'],
        ignoreEnvFile: false,
      }),
      CacheModule.register({
        isGlobal: true,
      }),
    ],
    controllers: [UserController, StaffController],
    providers: [PrismaService, UserService, StaffService],
  })
    .overrideProvider(CACHE_MANAGER)
    .useValue(mockCacheManager)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);

  return {
    app,
    module: moduleRef,
    prisma,
    userController: moduleRef.get<UserController>(UserController),
    staffController: moduleRef.get<StaffController>(StaffController),
    mockClerkClient,
    mockCacheManager,
  };
}

// ============================================================================
// DATABASE CLEANUP UTILITIES
// ============================================================================

/**
 * Cleans up all user-related test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanupUserTestData(
  prisma: PrismaService
): Promise<void> {
  try {
    // Delete in reverse order of dependencies
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.staff.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    // Don't delete settings as they may be required for the app
  } catch (error) {
    console.warn('Cleanup failed (some tables may not exist):', error);
  }
}

/**
 * Cleanup only staff records
 */
export async function cleanupStaff(prisma: PrismaService): Promise<void> {
  try {
    await prisma.staff.deleteMany({});
  } catch (error) {
    console.warn('Staff cleanup failed:', error);
  }
}

/**
 * Cleanup roles and permissions
 */
export async function cleanupRolesAndPermissions(
  prisma: PrismaService
): Promise<void> {
  try {
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
  } catch (error) {
    console.warn('Roles/Permissions cleanup failed:', error);
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Creates a test staff request
 */
export function createTestStaffRequest(
  cinemaId: string,
  overrides: Partial<CreateStaffTestData> = {}
): CreateStaffTestData {
  return {
    cinemaId,
    fullName: `Test Staff ${Date.now()}`,
    email: `staff${Date.now()}@test.com`,
    phone: '0901234567',
    gender: 'MALE',
    dob: new Date('1990-01-15'),
    position: 'TICKET_CLERK',
    status: 'ACTIVE',
    workType: 'FULL_TIME',
    shiftType: 'MORNING',
    salary: 10000000,
    hireDate: new Date('2024-01-01'),
    ...overrides,
  };
}

export interface CreateStaffTestData {
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: Date;
  position:
    | 'TICKET_CLERK'
    | 'CINEMA_MANAGER'
    | 'PROJECTIONIST'
    | 'CONCESSION_STAFF'
    | 'SECURITY'
    | 'USHER';
  status: 'ACTIVE' | 'INACTIVE';
  workType: 'FULL_TIME' | 'PART_TIME';
  shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  salary: number;
  hireDate: Date;
}

// ============================================================================
// SEED DATA HELPERS
// ============================================================================

/**
 * Seeds roles and permissions for testing
 * Returns { roleId, permissionIds }
 */
export async function seedRolesAndPermissions(
  prisma: PrismaService,
  userId: string
): Promise<{ roleId: string; permissionIds: string[] }> {
  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.create({ data: { name: 'READ_USERS' } }),
    prisma.permission.create({ data: { name: 'WRITE_USERS' } }),
    prisma.permission.create({ data: { name: 'DELETE_USERS' } }),
    prisma.permission.create({ data: { name: 'MANAGE_STAFF' } }),
  ]);
  const permissionIds = permissions.map((p) => p.id);

  // Create role
  const role = await prisma.role.create({
    data: { name: 'ADMIN' },
  });

  // Link role to permissions
  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: role.id,
      permissionId,
    })),
  });

  // Assign role to user
  await prisma.userRole.create({
    data: {
      userId,
      roleId: role.id,
    },
  });

  return { roleId: role.id, permissionIds };
}

/**
 * Seeds a setting variable for testing
 */
export async function seedSettingVariable(
  prisma: PrismaService,
  key: string,
  value: object,
  description?: string
): Promise<string> {
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value, description },
    create: { key, value, description },
  });
  return setting.key;
}

/**
 * Seeds test staff members
 */
export async function seedTestStaff(
  prisma: PrismaService,
  cinemaId: string,
  count: number = 3
): Promise<string[]> {
  const staffIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const staff = await prisma.staff.create({
      data: {
        cinemaId,
        fullName: `Staff Member ${i + 1}`,
        email: `staff${i + 1}@test.com`,
        phone: `090123456${i}`,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        dob: new Date('1990-01-15'),
        position: i === 0 ? 'CINEMA_MANAGER' : 'TICKET_CLERK',
        status: 'ACTIVE',
        workType: 'FULL_TIME',
        shiftType: i % 2 === 0 ? 'MORNING' : 'AFTERNOON',
        salary: 10000000 + i * 1000000,
        hireDate: new Date('2024-01-01'),
      },
    });
    staffIds.push(staff.id);
  }

  return staffIds;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Verifies that a staff member was persisted correctly
 */
export async function verifyStaffPersisted(
  prisma: PrismaService,
  staffId: string,
  expectedData: Partial<CreateStaffTestData>
): Promise<void> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
  });

  expect(staff).not.toBeNull();
  expect(staff?.fullName).toBe(expectedData.fullName);
  expect(staff?.email).toBe(expectedData.email);

  if (expectedData.position) {
    expect(staff?.position).toBe(expectedData.position);
  }

  // Verify timestamps are set
  expect(staff?.createdAt).toBeInstanceOf(Date);
  expect(staff?.updatedAt).toBeInstanceOf(Date);
}

// ============================================================================
// TEARDOWN UTILITY
// ============================================================================

/**
 * Properly closes the test context to prevent Jest hangs
 */
export async function closeUserTestContext(
  context: UserTestContext
): Promise<void> {
  try {
    await context.prisma.$disconnect();
    await context.app.close();
  } catch (error) {
    console.warn('Error during test context cleanup:', error);
  }
}
