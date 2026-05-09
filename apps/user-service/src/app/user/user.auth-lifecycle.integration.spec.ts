import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { StaffStatus } from '../../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { UserService } from './user.service';
import { CLERK_CLIENT } from '../clerk.module';

describe('UserService auth lifecycle integration', () => {
  let service: UserService;
  const prisma = {
    permission: { findMany: jest.fn() },
    role: { upsert: jest.fn() },
    userRole: { findFirst: jest.fn(), create: jest.fn() },
    clerkWebhookEvent: { findUnique: jest.fn(), create: jest.fn() },
    staff: { updateMany: jest.fn() },
  } as any;
  const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const clerkClient = { users: { getUserList: jest.fn(), createUser: jest.fn() } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: CLERK_CLIENT, useValue: clerkClient },
      ],
    }).compile();

    service = module.get(UserService);
    jest.clearAllMocks();
  });

  it('assigns CUSTOMER on user.created', async () => {
    prisma.clerkWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.userRole.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.role.upsert.mockResolvedValue({ id: 'r-customer' });

    await service.processClerkWebhook({
      eventId: 'evt_1',
      eventType: 'user.created',
      data: { id: 'user_1' },
      raw: { type: 'user.created' },
    });

    expect(prisma.role.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'CUSTOMER' } })
    );
    expect(prisma.userRole.create).toHaveBeenCalled();
    expect(cache.del).toHaveBeenCalledWith('permissions:user_1');
  });

  it('dedupes duplicated event id', async () => {
    prisma.clerkWebhookEvent.findUnique.mockResolvedValue({ id: 'existing' });
    const result = await service.processClerkWebhook({
      eventId: 'evt_dup',
      eventType: 'user.created',
      data: { id: 'user_2' },
    });
    expect(result).toEqual({ ok: true, deduped: true });
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it('handles user.deleted by deactivating staff mapping', async () => {
    prisma.clerkWebhookEvent.findUnique.mockResolvedValue(null);
    await service.processClerkWebhook({
      eventId: 'evt_del',
      eventType: 'user.deleted',
      data: { id: 'clerk_1' },
    });

    expect(prisma.staff.updateMany).toHaveBeenCalledWith({
      where: { clerkUserId: 'clerk_1' },
      data: { status: StaffStatus.INACTIVE },
    });
  });

  it('bootstraps SUPER_ADMIN from DEFAULT_ADMIN_EMAIL', async () => {
    process.env.DEFAULT_ADMIN_EMAIL = 'admin@example.com';
    clerkClient.users.getUserList.mockResolvedValue({ data: [{ id: 'clerk_admin_1' }] });
    prisma.role.upsert.mockResolvedValue({ id: 'r-super' });
    prisma.userRole.findFirst.mockResolvedValue(null);

    const result = await service.bootstrapDefaultSuperAdmin('cid-1');

    expect(result).toEqual({ ok: true, userId: 'clerk_admin_1' });
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: { userId: 'clerk_admin_1', roleId: 'r-super' },
    });
    expect(cache.del).toHaveBeenCalledWith('permissions:clerk_admin_1');
  });
});
