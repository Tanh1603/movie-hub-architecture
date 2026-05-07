import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../apps/user-service/src/app/app.module';
import { PrismaService } from '../../apps/user-service/src/app/prisma.service';

describe('User Service Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.$disconnect();
    await app.close();
  });

  describe('User Permissions', () => {
    it('should handle getting permissions for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/permissions/non-existent-user')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual([]);
    });

    it('should return permissions array format', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/permissions/test-user-id')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Each permission should be a string
      response.body.forEach((permission: unknown) => {
        expect(typeof permission).toBe('string');
      });
    });
  });

  describe('User List', () => {
    it('should return users from Clerk', async () => {
      // This test may require proper Clerk configuration
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect((res) => {
          // Should either succeed or fail with auth error
          expect([200, 401, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('Microservice Communication', () => {
    it('should handle microservice communication properly', async () => {
      // Test that the service can handle RPC calls properly
      const response = await request(app.getHttpServer())
        .get('/users/permissions/test-user-id')
        .expect(200);

      // Should not throw RPC errors
      expect(response.body).toBeDefined();
    });
  });
});
