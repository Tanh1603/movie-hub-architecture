import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '../../generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is required');
  }
  const clerkClient = createClerkClient({ secretKey });
  try {
    const email = process.env.DEFAULT_ADMIN_EMAIL;
    if (!email) {
      throw new Error('DEFAULT_ADMIN_EMAIL is required');
    }

    const users = await clerkClient.users.getUserList({ emailAddress: [email] });
    let clerkUserId: string;
    if (users.data.length === 0) {
      const password = process.env.DEFAULT_ADMIN_INITIAL_PASSWORD;
      if (!password) {
        throw new Error(
          'DEFAULT_ADMIN_INITIAL_PASSWORD is required when admin account does not exist'
        );
      }
      const created = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        skipPasswordChecks: true,
      });
      clerkUserId = created.id;
      console.log(`Created Clerk admin account ${clerkUserId}`);
    } else {
      clerkUserId = users.data[0].id;
    }
    const role = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });

    const existing = await prisma.userRole.findFirst({
      where: { userId: clerkUserId, roleId: role.id },
      select: { id: true },
    });

    if (!existing) {
      await prisma.userRole.create({ data: { userId: clerkUserId, roleId: role.id } });
      console.log(`Assigned SUPER_ADMIN to ${clerkUserId}`);
    } else {
      console.log(`SUPER_ADMIN already assigned to ${clerkUserId}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
