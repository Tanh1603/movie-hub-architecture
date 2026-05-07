import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Global test setup
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true,
  });
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/movie_hub_test?schema=public';
  }
}, 60000);

afterAll(async () => {
  // Global cleanup
  try {
    // Only try to disconnect if PrismaClient can be instantiated
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  } catch (e) {
    // Ignore if prisma is not generated yet
  }
});

// Increase timeout for integration tests
jest.setTimeout(30000);
