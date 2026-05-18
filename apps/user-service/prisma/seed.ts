import {
  PrismaClient,
  Gender,
  StaffStatus,
  WorkType,
  StaffPosition,
  ShiftType,
  PermissionAction,
  PermissionScope,
} from '../generated/prisma';

const prisma = new PrismaClient();

type PermissionSeed = {
  name: string;
  resourceCode: string;
  action: PermissionAction;
  scope: PermissionScope;
};

const resources = [
  { code: 'user', description: 'User and profile management resources' },
  { code: 'booking', description: 'Booking lifecycle resources' },
  { code: 'payment', description: 'Payment lifecycle resources' },
  { code: 'ticket', description: 'Ticket operation resources' },
  { code: 'refund', description: 'Refund workflow resources' },
  { code: 'showtime', description: 'Showtime operation resources' },
  { code: 'cinema', description: 'Cinema management resources' },
  { code: 'movie', description: 'Movie management resources' },
  { code: 'dashboard', description: 'Dashboard and reporting resources' },
  { code: 'rbac', description: 'RBAC administration resources' },
  { code: 'config', description: 'System configuration resources' },
  { code: 'admin', description: 'Global administrative resources' },
];

const permissions: PermissionSeed[] = [
  { name: 'user:read:global', resourceCode: 'user', action: PermissionAction.READ, scope: PermissionScope.GLOBAL },
  { name: 'user:update:global', resourceCode: 'user', action: PermissionAction.UPDATE, scope: PermissionScope.GLOBAL },
  { name: 'booking:read:own', resourceCode: 'booking', action: PermissionAction.READ, scope: PermissionScope.OWN },
  { name: 'booking:update:own', resourceCode: 'booking', action: PermissionAction.UPDATE, scope: PermissionScope.OWN },
  { name: 'booking:manage:own', resourceCode: 'booking', action: PermissionAction.MANAGE, scope: PermissionScope.OWN },
  { name: 'booking:read:cinema', resourceCode: 'booking', action: PermissionAction.READ, scope: PermissionScope.CINEMA },
  { name: 'booking:update:cinema', resourceCode: 'booking', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'cinema:read:cinema', resourceCode: 'cinema', action: PermissionAction.READ, scope: PermissionScope.CINEMA },
  { name: 'cinema:update:cinema', resourceCode: 'cinema', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'movie:update:cinema', resourceCode: 'movie', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'payment:read:own', resourceCode: 'payment', action: PermissionAction.READ, scope: PermissionScope.OWN },
  { name: 'payment:update:own', resourceCode: 'payment', action: PermissionAction.UPDATE, scope: PermissionScope.OWN },
  { name: 'payment:read:cinema', resourceCode: 'payment', action: PermissionAction.READ, scope: PermissionScope.CINEMA },
  { name: 'payment:update:cinema', resourceCode: 'payment', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'ticket:read:own', resourceCode: 'ticket', action: PermissionAction.READ, scope: PermissionScope.OWN },
  { name: 'ticket:read:cinema', resourceCode: 'ticket', action: PermissionAction.READ, scope: PermissionScope.CINEMA },
  { name: 'ticket:validate:cinema', resourceCode: 'ticket', action: PermissionAction.VALIDATE, scope: PermissionScope.CINEMA },
  { name: 'ticket:update:cinema', resourceCode: 'ticket', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'refund:create:own', resourceCode: 'refund', action: PermissionAction.CREATE, scope: PermissionScope.OWN },
  { name: 'refund:read:cinema', resourceCode: 'refund', action: PermissionAction.READ, scope: PermissionScope.CINEMA },
  { name: 'refund:update:cinema', resourceCode: 'refund', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'refund:approve:global', resourceCode: 'refund', action: PermissionAction.APPROVE, scope: PermissionScope.GLOBAL },
  { name: 'showtime:read:cinema', resourceCode: 'showtime', action: PermissionAction.READ, scope: PermissionScope.CINEMA },
  { name: 'showtime:update:cinema', resourceCode: 'showtime', action: PermissionAction.UPDATE, scope: PermissionScope.CINEMA },
  { name: 'dashboard:read:global', resourceCode: 'dashboard', action: PermissionAction.READ, scope: PermissionScope.GLOBAL },
  { name: 'rbac:read:global', resourceCode: 'rbac', action: PermissionAction.READ, scope: PermissionScope.GLOBAL },
  { name: 'rbac:update:global', resourceCode: 'rbac', action: PermissionAction.UPDATE, scope: PermissionScope.GLOBAL },
  { name: 'config:read:global', resourceCode: 'config', action: PermissionAction.READ, scope: PermissionScope.GLOBAL },
  { name: 'config:update:global', resourceCode: 'config', action: PermissionAction.UPDATE, scope: PermissionScope.GLOBAL },
];

const rolePermissionMatrix: Record<string, string[]> = {
  ADMIN: permissions.map((permission) => permission.name),
  CUSTOMER: [
    'booking:read:own',
    'booking:update:own',
    'booking:manage:own',
    'payment:read:own',
    'payment:update:own',
    'ticket:read:own',
    'refund:create:own',
  ],
  CINEMA_MANAGER: [
    'user:read:global',
    'booking:read:cinema',
    'booking:update:cinema',
    'movie:update:cinema',
    'cinema:read:cinema',
    'cinema:update:cinema',
    'payment:read:cinema',
    'payment:update:cinema',
    'ticket:read:cinema',
    'ticket:validate:cinema',
    'ticket:update:cinema',
    'refund:read:cinema',
    'refund:update:cinema',
    'showtime:read:cinema',
    'showtime:update:cinema',
  ],
  ASSISTANT_MANAGER: [
    'booking:read:cinema',
    'booking:update:cinema',
    'payment:read:cinema',
    'ticket:read:cinema',
    'ticket:validate:cinema',
    'ticket:update:cinema',
    'refund:read:cinema',
    'showtime:read:cinema',
    'showtime:update:cinema',
  ],
  TICKET_CLERK: [
    'booking:read:cinema',
    'payment:read:cinema',
    'ticket:read:cinema',
    'ticket:validate:cinema',
    'ticket:update:cinema',
  ],
  CONCESSION_STAFF: ['booking:read:cinema', 'booking:update:cinema'],
  USHER: ['ticket:read:cinema', 'ticket:validate:cinema'],
  PROJECTIONIST: ['showtime:read:cinema', 'showtime:update:cinema'],
  CLEANER: [],
  SECURITY: ['ticket:read:cinema', 'ticket:validate:cinema'],
};

async function main() {
  console.log('Seeding User Service database...');

  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.clerkSyncTask.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.setting.deleteMany();

  const resourceMap = new Map<string, string>();
  for (const resource of resources) {
    const created = await prisma.resource.create({ data: resource });
    resourceMap.set(resource.code, created.id);
  }

  const permissionRows = [] as Array<{ id: string; name: string }>;
  for (const permission of permissions) {
    const resourceId = resourceMap.get(permission.resourceCode);
    if (!resourceId) {
      throw new Error(`Missing resource id for ${permission.resourceCode}`);
    }

    const created = await prisma.permission.create({
      data: {
        name: permission.name,
        resourceId,
        action: permission.action,
        scope: permission.scope,
      },
    });
    permissionRows.push({ id: created.id, name: created.name });
  }

  const roles = {
    ADMIN: await prisma.role.create({ data: { name: 'ADMIN' } }),
    CUSTOMER: await prisma.role.create({ data: { name: 'CUSTOMER' } }),
    CINEMA_MANAGER: await prisma.role.create({ data: { name: 'CINEMA_MANAGER' } }),
    ASSISTANT_MANAGER: await prisma.role.create({ data: { name: 'ASSISTANT_MANAGER' } }),
    TICKET_CLERK: await prisma.role.create({ data: { name: 'TICKET_CLERK' } }),
    CONCESSION_STAFF: await prisma.role.create({ data: { name: 'CONCESSION_STAFF' } }),
    USHER: await prisma.role.create({ data: { name: 'USHER' } }),
    PROJECTIONIST: await prisma.role.create({ data: { name: 'PROJECTIONIST' } }),
    CLEANER: await prisma.role.create({ data: { name: 'CLEANER' } }),
    SECURITY: await prisma.role.create({ data: { name: 'SECURITY' } }),
  };

  for (const [roleName, permissionNames] of Object.entries(rolePermissionMatrix)) {
    const role = roles[roleName as keyof typeof roles];
    const allowed = new Set(permissionNames);
    for (const permission of permissionRows) {
      if (!allowed.has(permission.name)) {
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const users = {
    admin: 'user-admin-001',
    manager: 'user-manager-001',
    staff: 'user-staff-001',
    customer1: 'user-customer-001',
    customer2: 'user-customer-002',
  };

  await prisma.userRole.createMany({
    data: [
      { userId: users.admin, roleId: roles.ADMIN.id },
      { userId: users.manager, roleId: roles.CINEMA_MANAGER.id },
      { userId: users.staff, roleId: roles.TICKET_CLERK.id },
      { userId: users.customer1, roleId: roles.CUSTOMER.id },
      { userId: users.customer2, roleId: roles.CUSTOMER.id },
    ],
  });

  await prisma.staff.createMany({
    data: [
      {
        cinemaId: 'aaaa1111-0000-0000-0000-000000000001',
        fullName: 'Le Minh Quan',
        email: 'quan.le@cgv.vn',
        phone: '0903000111',
        gender: Gender.MALE,
        dob: new Date('1990-05-12'),
        position: StaffPosition.CINEMA_MANAGER,
        status: StaffStatus.ACTIVE,
        workType: WorkType.FULL_TIME,
        shiftType: ShiftType.MORNING,
        salary: 25000000,
        hireDate: new Date('2020-01-05'),
      },
      {
        cinemaId: 'aaaa1111-0000-0000-0000-000000000002',
        fullName: 'Tran Thu Ha',
        email: 'ha.tran@bhdstar.vn',
        phone: '0912000222',
        gender: Gender.FEMALE,
        dob: new Date('1994-08-21'),
        position: StaffPosition.TICKET_CLERK,
        status: StaffStatus.ACTIVE,
        workType: WorkType.PART_TIME,
        shiftType: ShiftType.AFTERNOON,
        salary: 12000000,
        hireDate: new Date('2022-09-10'),
      },
    ],
  });

  await prisma.setting.create({
    data: {
      key: 'auth.passwordPolicy',
      value: { minLength: 8, requireSpecial: true, requireNumber: true },
      description: 'Password policy baseline',
    },
  });

  console.log('Seeded RBAC resources, permissions, roles, users, staff, and settings.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

