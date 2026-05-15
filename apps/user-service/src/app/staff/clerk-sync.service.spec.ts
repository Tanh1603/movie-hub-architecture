import { ClerkSyncService } from './clerk-sync.service';
import { ClerkSyncAction, ClerkSyncStatus } from '../../../generated/prisma';

describe('ClerkSyncService', () => {
  let prisma: any;
  let cacheManager: any;
  let clerkClient: any;
  let service: ClerkSyncService;

  beforeEach(() => {
    prisma = {
      clerkSyncTask: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      staff: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn) => fn({
        role: {
          upsert: jest.fn().mockResolvedValue({ id: 'role_1' }),
        },
        userRole: {
          findMany: jest.fn().mockResolvedValue([]),
          deleteMany: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
      })),
    };

    cacheManager = { del: jest.fn() };
    clerkClient = {
      users: {
        getUserList: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        getUser: jest.fn(),
      },
    };

    service = new ClerkSyncService(prisma, cacheManager, clerkClient);
  });

  it('enqueueUpsert should dedupe active sync key', async () => {
    prisma.clerkSyncTask.findFirst.mockResolvedValue({ id: 'task_existing' });

    const id = await service.enqueueUpsert({
      email: 'a@b.com',
      fullName: 'A B',
      position: 'TICKET_CLERK',
      cinemaId: 'cinema-1',
      status: 'ACTIVE',
    });

    expect(id).toBe('task_existing');
    expect(prisma.clerkSyncTask.create).not.toHaveBeenCalled();
  });

  it('processDueTasks should dead-letter after max retry', async () => {
    prisma.clerkSyncTask.findMany.mockResolvedValue([
      {
        id: 't1',
        syncKey: 'sync-1',
        action: ClerkSyncAction.UPSERT,
        payload: {
          email: 'a@b.com',
          fullName: 'A B',
          position: 'TICKET_CLERK',
          cinemaId: 'cinema-1',
          status: 'ACTIVE',
        },
        attempts: 2,
      },
    ]);

    prisma.clerkSyncTask.updateMany.mockResolvedValue({ count: 1 });
    clerkClient.users.getUserList.mockRejectedValue({ status: 503, message: 'upstream down' });

    await service.processDueTasks();

    expect(prisma.clerkSyncTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: expect.objectContaining({
          attempts: 3,
          status: ClerkSyncStatus.FAILED,
          deadLetteredAt: expect.any(Date),
        }),
      })
    );
  });

  it('processDueTasks should schedule retry for transient error before max attempts', async () => {
    prisma.clerkSyncTask.findMany.mockResolvedValue([
      {
        id: 't2',
        syncKey: 'sync-2',
        action: ClerkSyncAction.UPSERT,
        payload: {
          email: 'b@b.com',
          fullName: 'B B',
          position: 'TICKET_CLERK',
          cinemaId: 'cinema-2',
          status: 'ACTIVE',
        },
        attempts: 0,
      },
    ]);

    prisma.clerkSyncTask.updateMany.mockResolvedValue({ count: 1 });
    clerkClient.users.getUserList.mockRejectedValue({ status: 503, message: 'temporary outage' });

    await service.processDueTasks();

    expect(prisma.clerkSyncTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't2' },
        data: expect.objectContaining({
          attempts: 1,
          status: ClerkSyncStatus.FAILED,
          deadLetteredAt: null,
          nextRetryAt: expect.any(Date),
        }),
      })
    );
  });

  it('reconcileStaffMetadataDrift should repair mismatched metadata with audit trail', async () => {
    const logSpy = jest.spyOn((service as any).logger, 'warn');

    prisma.staff.findMany.mockResolvedValue([
      {
        id: 's1',
        clerkUserId: 'clerk_1',
        email: 'a@b.com',
        fullName: 'A B',
        position: 'TICKET_CLERK',
        cinemaId: 'cinema-1',
        status: 'ACTIVE',
      },
    ]);

    clerkClient.users.getUser.mockResolvedValue({
      publicMetadata: {
        role: 'USHER',
        cinemaId: 'cinema-x',
        staffStatus: 'INACTIVE',
      },
    });

    await service.reconcileStaffMetadataDrift();

    expect(clerkClient.users.updateUser).toHaveBeenCalledWith(
      'clerk_1',
      expect.objectContaining({
        publicMetadata: expect.objectContaining({
          role: 'TICKET_CLERK',
          cinemaId: 'cinema-1',
          staffStatus: 'ACTIVE',
        }),
      })
    );

    // Verify audit trail includes before/after and direction
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('clerk_sync_drift_repaired')
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('direction=internal_to_clerk')
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('before=')
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('after=')
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('correlationId=recon_')
    );
  });
});
