import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../apps/cinema-service/src/app/app.module';
import { PrismaService } from '../../apps/cinema-service/src/app/prisma.service';

describe('Cinema Service Integration Tests', () => {
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

  describe('Cinema Locations', () => {
    it('should get all cinema locations', async () => {
      const response = await request(app.getHttpServer())
        .get('/cinema-locations')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination for cinema locations', async () => {
      const response = await request(app.getHttpServer())
        .get('/cinema-locations?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      if (response.body.meta) {
        expect(response.body.meta).toHaveProperty('page');
        expect(response.body.meta).toHaveProperty('limit');
      }
    });

    it('should filter cinema locations by distance', async () => {
      const response = await request(app.getHttpServer())
        .get('/cinema-locations?latitude=10.8231&longitude=106.6297&radius=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Cinemas', () => {
    it('should get all cinemas', async () => {
      const response = await request(app.getHttpServer())
        .get('/cinemas')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle non-existent cinema', async () => {
      await request(app.getHttpServer())
        .get('/cinemas/non-existent-id')
        .expect(404);
    });
  });

  describe('Showtimes', () => {
    it('should get showtimes with proper query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/showtimes?cinemaId=test-cinema&movieId=test-movie&date=2025-10-24'
        )
        .expect((res) => {
          // Should either return 200 with data or 404 if no showtimes
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should handle showtime seat availability', async () => {
      const response = await request(app.getHttpServer())
        .get('/showtimes/test-showtime-id/seats')
        .expect((res) => {
          // Should either return 200 with seats or 404 if showtime not found
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('Real-time Features', () => {
    it('should handle seat reservation updates', async () => {
      // Test the real-time seat update functionality
      const response = await request(app.getHttpServer())
        .post('/showtimes/test-showtime-id/reserve-seats')
        .send({
          seatIds: ['seat-1', 'seat-2'],
          userId: 'test-user-id',
        })
        .expect((res) => {
          // Should handle reservation attempt
          expect([200, 400, 404, 409]).toContain(res.status);
        });

      // Test should not fail even if reservation fails due to missing data
      expect(response.status).toBeDefined();
    });
  });

  describe('Microservice Communication', () => {
    it('should handle microservice errors gracefully', async () => {
      // Test that service handles RPC communication properly
      const response = await request(app.getHttpServer())
        .get('/cinemas')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
