const fs = require('fs');
const path = require('path');

// Load environment variables from user-service's .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../apps/user-service/.env') });

const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Helper to find PrismaClient in different environments (Local vs Docker)
function getPrismaClient(serviceName) {
  const possiblePaths = [
    `../../apps/${serviceName}/generated/prisma`, // Local development
    '../../generated/prisma', // Docker container (flattened)
    `../../apps/${serviceName}/generated/prisma`, // Docker fallback
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(path.resolve(__dirname, p))) {
        return require(p);
      }
    } catch (e) {
      // Ignore
    }
  }
  return null;
}

const userPrismaModule = getPrismaClient('user-service') || require('../../apps/user-service/generated/prisma');
const { PrismaClient, Gender, StaffStatus, WorkType, StaffPosition, ShiftType } = userPrismaModule;
const prisma = new PrismaClient();

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

const permissions = [
  { name: 'user:read:global', resourceCode: 'user', action: 'READ', scope: 'GLOBAL' },
  { name: 'user:update:global', resourceCode: 'user', action: 'UPDATE', scope: 'GLOBAL' },
  { name: 'booking:read:own', resourceCode: 'booking', action: 'READ', scope: 'OWN' },
  { name: 'booking:update:own', resourceCode: 'booking', action: 'UPDATE', scope: 'OWN' },
  { name: 'booking:manage:own', resourceCode: 'booking', action: 'MANAGE', scope: 'OWN' },
  { name: 'booking:read:cinema', resourceCode: 'booking', action: 'READ', scope: 'CINEMA' },
  { name: 'booking:update:cinema', resourceCode: 'booking', action: 'UPDATE', scope: 'CINEMA' },
  { name: 'cinema:read:cinema', resourceCode: 'cinema', action: 'READ', scope: 'CINEMA' },
  { name: 'cinema:update:cinema', resourceCode: 'cinema', action: 'UPDATE', scope: 'CINEMA' },
  { name: 'cinema:create:global', resourceCode: 'cinema', action: 'CREATE', scope: 'GLOBAL' },
  { name: 'cinema:delete:global', resourceCode: 'cinema', action: 'DELETE', scope: 'GLOBAL' },
  { name: 'movie:create:global', resourceCode: 'movie', action: 'CREATE', scope: 'GLOBAL' },
  { name: 'movie:update:global', resourceCode: 'movie', action: 'UPDATE', scope: 'GLOBAL' },
  { name: 'movie:delete:global', resourceCode: 'movie', action: 'DELETE', scope: 'GLOBAL' },
  { name: 'payment:read:own', resourceCode: 'payment', action: 'READ', scope: 'OWN' },
  { name: 'payment:update:own', resourceCode: 'payment', action: 'UPDATE', scope: 'OWN' },
  { name: 'payment:read:cinema', resourceCode: 'payment', action: 'READ', scope: 'CINEMA' },
  { name: 'payment:update:cinema', resourceCode: 'payment', action: 'UPDATE', scope: 'CINEMA' },
  { name: 'ticket:read:own', resourceCode: 'ticket', action: 'READ', scope: 'OWN' },
  { name: 'ticket:read:cinema', resourceCode: 'ticket', action: 'READ', scope: 'CINEMA' },
  { name: 'ticket:validate:cinema', resourceCode: 'ticket', action: 'VALIDATE', scope: 'CINEMA' },
  { name: 'ticket:update:cinema', resourceCode: 'ticket', action: 'UPDATE', scope: 'CINEMA' },
  { name: 'refund:create:own', resourceCode: 'refund', action: 'CREATE', scope: 'OWN' },
  { name: 'refund:read:cinema', resourceCode: 'refund', action: 'READ', scope: 'CINEMA' },
  { name: 'refund:update:cinema', resourceCode: 'refund', action: 'UPDATE', scope: 'CINEMA' },
  { name: 'refund:approve:global', resourceCode: 'refund', action: 'APPROVE', scope: 'GLOBAL' },
  { name: 'showtime:read:cinema', resourceCode: 'showtime', action: 'READ', scope: 'CINEMA' },
  { name: 'showtime:update:cinema', resourceCode: 'showtime', action: 'UPDATE', scope: 'CINEMA' },
  { name: 'dashboard:read:global', resourceCode: 'dashboard', action: 'READ', scope: 'GLOBAL' },
  { name: 'dashboard:read:cinema', resourceCode: 'dashboard', action: 'READ', scope: 'CINEMA' },
  { name: 'rbac:read:global', resourceCode: 'rbac', action: 'READ', scope: 'GLOBAL' },
  { name: 'rbac:update:global', resourceCode: 'rbac', action: 'UPDATE', scope: 'GLOBAL' },
  { name: 'config:read:global', resourceCode: 'config', action: 'READ', scope: 'GLOBAL' },
  { name: 'config:update:global', resourceCode: 'config', action: 'UPDATE', scope: 'GLOBAL' },
];

const rolePermissionMatrix = {
  ADMIN: permissions.map(p => p.name),
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
    'dashboard:read:cinema',
  ],
  STAFF: [
    'booking:read:cinema',
    'payment:read:cinema',
    'ticket:read:cinema',
    'ticket:validate:cinema',
    'ticket:update:cinema',
  ],
};

async function main() {
  console.log('👥 Starting User Service seed...');

  // CLEANUP
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.clerkSyncTask.deleteMany();
  await prisma.clerkWebhookEvent.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.setting.deleteMany();

  console.log('✅ Cleaned existing data');

  // RESOURCES
  const resourceMap = new Map();
  for (const resource of resources) {
    const created = await prisma.resource.create({ data: resource });
    resourceMap.set(resource.code, created.id);
  }
  console.log('✅ Seeded resources');

  // PERMISSIONS
  const permissionRows = [];
  for (const p of permissions) {
    const resourceId = resourceMap.get(p.resourceCode);
    const created = await prisma.permission.create({
      data: {
        name: p.name,
        resourceId,
        action: p.action,
        scope: p.scope,
      }
    });
    permissionRows.push({ id: created.id, name: created.name });
  }
  console.log('✅ Seeded permissions');

  // ROLES
  const roles = {
    ADMIN: await prisma.role.create({ data: { name: 'ADMIN' } }),
    CUSTOMER: await prisma.role.create({ data: { name: 'CUSTOMER' } }),
    CINEMA_MANAGER: await prisma.role.create({ data: { name: 'CINEMA_MANAGER' } }),
    STAFF: await prisma.role.create({ data: { name: 'STAFF' } }),
  };
  console.log('✅ Seeded roles');

  // ROLE-PERMISSIONS
  for (const [roleName, permissionNames] of Object.entries(rolePermissionMatrix)) {
    const role = roles[roleName];
    const allowed = new Set(permissionNames);
    for (const permission of permissionRows) {
      if (allowed.has(permission.name)) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          }
        });
      }
    }
  }
  console.log('✅ Mapped role permissions');

  // Get or Create Clerk Admin dynamically
  const secretKey = process.env.CLERK_SECRET_KEY;
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@gm.com';
  const adminPassword = process.env.DEFAULT_ADMIN_INITIAL_PASSWORD || 'MovieHub';
  const managerPassword = process.env.DEFAULT_MANAGER_INITIAL_PASSWORD || 'MovieHub';
  const staffPassword = process.env.DEFAULT_STAFF_INITIAL_PASSWORD || 'MovieHub';
  const customerPassword = process.env.DEFAULT_CUSTOMER_INITIAL_PASSWORD || 'MovieHub';

  const clerkClient = secretKey ? createClerkClient({ secretKey }) : null;

  let adminClerkUserId = 'user_2oXh7B6bB3aG9F9jQ1d4C8eV2m1'; // Default fallback

  if (clerkClient) {
    try {
      const userList = await clerkClient.users.getUserList({ emailAddress: [adminEmail] });
      if (userList.data.length > 0) {
        adminClerkUserId = userList.data[0].id;
        console.log(`✅ Found existing Clerk admin user: ${adminEmail} -> ${adminClerkUserId}`);
        await clerkClient.users.updateUser(adminClerkUserId, {
          password: adminPassword,
          publicMetadata: { role: 'ADMIN' }
        });
        console.log(`   ✅ Synced publicMetadata for ADMIN`);
      } else {
        const created = await clerkClient.users.createUser({
          emailAddress: [adminEmail],
          password: adminPassword,
          skipPasswordChecks: true,
          publicMetadata: { role: 'ADMIN' }
        });
        adminClerkUserId = created.id;
        console.log(`✅ Created new Clerk admin user: ${adminEmail} -> ${adminClerkUserId}`);
      }
    } catch (err) {
      console.error('⚠️ Failed to fetch/create admin user in Clerk, using fallback:', err.message);
    }
  }

  // Load cinema-service env variables for cross-service database access
  let cinemaDatabaseUrl = 'postgresql://postgres:postgres@localhost:5436/movie_hub_cinema';
  try {
    const cinemaEnvPath = path.resolve(__dirname, '../../apps/cinema-service/.env');
    if (fs.existsSync(cinemaEnvPath)) {
      const cinemaEnv = require('dotenv').parse(fs.readFileSync(cinemaEnvPath));
      if (cinemaEnv.DATABASE_URL) {
        cinemaDatabaseUrl = cinemaEnv.DATABASE_URL;
      }
    }
  } catch (e) {
    // ignore
  }

  const CinemaPrismaModule = getPrismaClient('cinema-service');
  const cinemaPrisma = CinemaPrismaModule ? new CinemaPrismaModule.PrismaClient({
    datasources: {
      db: {
        url: cinemaDatabaseUrl
      }
    }
  }) : null;

  let cinemasDb = [];
  if (cinemaPrisma) {
    try {
      cinemasDb = await cinemaPrisma.cinemas.findMany();
      console.log(`✅ Fetched ${cinemasDb.length} cinemas from Cinema Service`);
    } catch (e) {
      console.warn('⚠️ Could not fetch cinemas from Cinema Service database, using static fallback:', e.message);
    }
  }

  const findCinemaId = (keyword) => {
    const match = cinemasDb.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
    return match ? match.id : '77777777-7777-7777-7777-777777777777'; // Fallback
  };

  // Managers configuration
  const managerConfigs = [
    {
      email: 'manager.landmark@gm.com',
      fullName: 'Le Minh Quan',
      phone: '0903000111',
      gender: Gender.MALE,
      dob: new Date('1990-05-12'),
      fallbackClerkId: 'user_manager_landmark_001',
      cinemaKeyword: 'Landmark',
    },
    {
      email: 'manager.diamond@gm.com',
      fullName: 'Nguyen Van An',
      phone: '0903000222',
      gender: Gender.MALE,
      dob: new Date('1992-06-15'),
      fallbackClerkId: 'user_manager_diamond_002',
      cinemaKeyword: 'Diamond',
    },
    {
      email: 'manager.crescent@gm.com',
      fullName: 'Tran Thi Binh',
      phone: '0903000333',
      gender: Gender.FEMALE,
      dob: new Date('1994-07-20'),
      fallbackClerkId: 'user_manager_crescent_003',
      cinemaKeyword: 'Crescent',
    },
    {
      email: 'manager.metropolis@gm.com',
      fullName: 'Pham Van Chung',
      phone: '0903000444',
      gender: Gender.MALE,
      dob: new Date('1988-08-25'),
      fallbackClerkId: 'user_manager_metropolis_004',
      cinemaKeyword: 'Metropolis',
    },
    {
      email: 'manager.gigamall@gm.com',
      fullName: 'Hoang Thi Dung',
      phone: '0903000555',
      gender: Gender.FEMALE,
      dob: new Date('1995-09-30'),
      fallbackClerkId: 'user_manager_gigamall_005',
      cinemaKeyword: 'Gigamall',
    },
    {
      email: 'manager.university@gm.com',
      fullName: 'Le Van Em',
      phone: '0903000666',
      gender: Gender.MALE,
      dob: new Date('1997-10-05'),
      fallbackClerkId: 'user_manager_university_006',
      cinemaKeyword: 'University',
    },
    {
      email: 'manager.levanviet@gm.com',
      fullName: 'Doan Thi Phuong',
      phone: '0903000777',
      gender: Gender.FEMALE,
      dob: new Date('1993-11-12'),
      fallbackClerkId: 'user_manager_levanviet_007',
      cinemaKeyword: 'Le Van Viet',
    },
  ];

  const staffConfigs = [
    {
      email: 'staff.landmark@gm.com',
      fullName: 'Tran Thu Ha',
      phone: '0912000222',
      gender: Gender.FEMALE,
      dob: new Date('1994-08-21'),
      fallbackClerkId: 'user_staff_landmark_001',
      cinemaKeyword: 'Landmark',
    }
  ];

  const customerConfigs = [
    {
      email: 'customer@gm.com',
      fullName: 'Nguyen Khach Hang',
      phone: '0909999888',
      gender: Gender.MALE,
      dob: new Date('1998-01-01'),
      fallbackClerkId: 'user_customer_test_001',
    }
  ];

  const usersToSeed = [
    { userId: adminClerkUserId, roleId: roles.ADMIN.id },
    { userId: 'user_2tWn3x8y9z0a1b2c3d4e5f6g7h8', roleId: roles.CUSTOMER.id },
    { userId: 'user_test_customer_01', roleId: roles.CUSTOMER.id },
  ];

  const staffsToSeed = [];

  // Seed Managers
  for (const manager of managerConfigs) {
    let resolvedClerkId = manager.fallbackClerkId;
    const managerCinemaId = findCinemaId(manager.cinemaKeyword);
    const managerMetadata = {
      role: 'CINEMA_MANAGER',
      cinemaId: managerCinemaId,
      staffStatus: 'ACTIVE'
    };
    if (clerkClient) {
      try {
        const userList = await clerkClient.users.getUserList({ emailAddress: [manager.email] });
        if (userList.data.length > 0) {
          resolvedClerkId = userList.data[0].id;
          console.log(`   ✅ Found Clerk manager user: ${manager.email} -> ${resolvedClerkId}`);
          await clerkClient.users.updateUser(resolvedClerkId, {
            password: managerPassword,
            publicMetadata: managerMetadata
          });
          console.log(`      ✅ Synced publicMetadata for CINEMA_MANAGER`);
        } else {
          const created = await clerkClient.users.createUser({
            emailAddress: [manager.email],
            password: managerPassword,
            skipPasswordChecks: true,
            publicMetadata: managerMetadata
          });
          resolvedClerkId = created.id;
          console.log(`   ✅ Created Clerk manager user: ${manager.email} -> ${resolvedClerkId}`);
        }
      } catch (err) {
        console.error(`   ⚠️ Failed to create manager for ${manager.email}, using fallback:`, err.message);
      }
    }

    usersToSeed.push({ userId: resolvedClerkId, roleId: roles.CINEMA_MANAGER.id });
    staffsToSeed.push({
      cinemaId: findCinemaId(manager.cinemaKeyword),
      clerkUserId: resolvedClerkId,
      fullName: manager.fullName,
      email: manager.email,
      phone: manager.phone,
      gender: manager.gender,
      dob: manager.dob,
      position: StaffPosition.CINEMA_MANAGER,
      status: StaffStatus.ACTIVE,
      workType: WorkType.FULL_TIME,
      shiftType: ShiftType.MORNING,
      salary: 25000000,
      hireDate: new Date('2020-01-05'),
    });
  }

  // Seed Ticket Clerk
  for (const staff of staffConfigs) {
    let resolvedClerkId = staff.fallbackClerkId;
    const staffCinemaId = findCinemaId(staff.cinemaKeyword);
    const staffMetadata = {
      role: 'STAFF',
      cinemaId: staffCinemaId,
      staffStatus: 'ACTIVE'
    };
    if (clerkClient) {
      try {
        const userList = await clerkClient.users.getUserList({ emailAddress: [staff.email] });
        if (userList.data.length > 0) {
          resolvedClerkId = userList.data[0].id;
          console.log(`   ✅ Found Clerk staff user: ${staff.email} -> ${resolvedClerkId}`);
          await clerkClient.users.updateUser(resolvedClerkId, {
            password: staffPassword,
            publicMetadata: staffMetadata
          });
          console.log(`      ✅ Synced publicMetadata for TICKET_CLERK`);
        } else {
          const created = await clerkClient.users.createUser({
            emailAddress: [staff.email],
            password: staffPassword,
            skipPasswordChecks: true,
            publicMetadata: staffMetadata
          });
          resolvedClerkId = created.id;
          console.log(`   ✅ Created Clerk staff user: ${staff.email} -> ${resolvedClerkId}`);
        }
      } catch (err) {
        console.error(`   ⚠️ Failed to create staff for ${staff.email}, using fallback:`, err.message);
      }
    }

    usersToSeed.push({ userId: resolvedClerkId, roleId: roles.STAFF.id });
    staffsToSeed.push({
      cinemaId: findCinemaId(staff.cinemaKeyword),
      clerkUserId: resolvedClerkId,
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      gender: staff.gender,
      dob: staff.dob,
      position: StaffPosition.TICKET_CLERK,
      status: StaffStatus.ACTIVE,
      workType: WorkType.PART_TIME,
      shiftType: ShiftType.AFTERNOON,
      salary: 12000000,
      hireDate: new Date('2022-09-10'),
    });
  }

  // Seed Customers
  for (const customer of customerConfigs) {
    let resolvedClerkId = customer.fallbackClerkId;
    const customerMetadata = {
      role: 'CUSTOMER',
    };
    if (clerkClient) {
      try {
        const userList = await clerkClient.users.getUserList({ emailAddress: [customer.email] });
        if (userList.data.length > 0) {
          resolvedClerkId = userList.data[0].id;
          console.log(`   ✅ Found Clerk customer user: ${customer.email} -> ${resolvedClerkId}`);
          await clerkClient.users.updateUser(resolvedClerkId, {
            password: customerPassword,
            publicMetadata: customerMetadata
          });
          console.log(`      ✅ Synced publicMetadata for CUSTOMER`);
        } else {
          const created = await clerkClient.users.createUser({
            emailAddress: [customer.email],
            password: customerPassword,
            skipPasswordChecks: true,
            publicMetadata: customerMetadata
          });
          resolvedClerkId = created.id;
          console.log(`   ✅ Created Clerk customer user: ${customer.email} -> ${resolvedClerkId}`);
        }
      } catch (err) {
        console.error(`   ⚠️ Failed to create customer for ${customer.email}, using fallback:`, err.message);
      }
    }

    usersToSeed.push({ userId: resolvedClerkId, roleId: roles.CUSTOMER.id });
  }

  await prisma.userRole.createMany({ data: usersToSeed });
  console.log('✅ Seeded user roles');

  await prisma.staff.createMany({ data: staffsToSeed });
  console.log('✅ Seeded staffs');

  // SETTINGS
  await prisma.setting.create({
    data: {
      key: 'auth.passwordPolicy',
      value: { minLength: 8, requireSpecial: true, requireNumber: true },
      description: 'Password policy baseline',
    }
  });
  console.log('✅ Seeded settings');

  console.log('🎉 User Service seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding User Service:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
