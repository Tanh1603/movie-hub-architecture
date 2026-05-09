import { StaffService } from './staff.service';

describe('StaffService integration lifecycle', () => {
  const prisma = {
    $transaction: jest.fn(async (fn) => fn({ staff: { upsert: jest.fn() } })),
    staff: { findUnique: jest.fn() },
  } as any;
  const clerkSyncService = {
    ensureClerkUserForStaff: jest.fn(),
    enqueueDelete: jest.fn(),
  } as any;

  let service: StaffService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StaffService(prisma, clerkSyncService);
  });

  it('create staff should create/link real Clerk user first', async () => {
    clerkSyncService.ensureClerkUserForStaff.mockResolvedValue('clerk_123');
    prisma.$transaction.mockImplementationOnce(async (fn) =>
      fn({
        staff: {
          upsert: jest.fn().mockResolvedValue({
            id: 's1',
            cinemaId: 'c1',
            fullName: 'Staff 1',
            email: 'staff1@example.com',
            phone: '0909',
            gender: 'MALE',
            dob: new Date('1990-01-01'),
            position: 'TICKET_CLERK',
            status: 'ACTIVE',
            workType: 'FULL_TIME',
            shiftType: 'MORNING',
            salary: 1000,
            hireDate: new Date('2020-01-01'),
          }),
        },
      })
    );

    await service.create({
      cinemaId: 'c1',
      fullName: 'Staff 1',
      email: 'staff1@example.com',
      phone: '0909',
      gender: 'MALE',
      dob: new Date('1990-01-01'),
      position: 'TICKET_CLERK',
      status: 'ACTIVE',
      workType: 'FULL_TIME',
      shiftType: 'MORNING',
      salary: 1000,
      hireDate: new Date('2020-01-01'),
    } as any);

    expect(clerkSyncService.ensureClerkUserForStaff).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'staff1@example.com' })
    );
  });
});
