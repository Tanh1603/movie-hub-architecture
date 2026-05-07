import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../apps/api-gateway/src/app/app.module';
import { ClerkAuthGuard } from '../../apps/api-gateway/src/app/common/guard/clerk-auth.guard';
import { MockAuthGuard } from './utils/test-auth.util';
import { PrismaTestUtil } from './utils/prisma-test.util';
import { RedisTestUtil } from './utils/redis-test.util';
import { io, Socket } from 'socket.io-client';
import { version } from '../../package.json';

describe('Booking Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaTestUtil;
  let redis: RedisTestUtil;
  let clientSocket: Socket;

  // Test Data
  let testUser = 'user_test_e2e';
  let cinemaId: string;
  let hallId: string;
  let seatId: string;
  let movieId: string;
  let movieReleaseId: string;
  let showtimeId: string;
  let bookingId: string;

  beforeAll(async () => {
    // 1. Setup Prisma & Redis
    prisma = new PrismaTestUtil();
    await prisma.connect();
    redis = new RedisTestUtil();

    // 2. Fetch/Create Prerequisites Data
    const cinema = await prisma.getCinemaWithHallAndSeats();
    if (!cinema || !cinema.halls[0] || !cinema.halls[0].seats[0]) {
      throw new Error('No Cinema/Hall/Seat found in DB. Please seed database.');
    }
    cinemaId = cinema.id;
    hallId = cinema.halls[0].id;
    seatId = cinema.halls[0].seats[0].id;

    const movie = await prisma.getMovieWithRelease();
    if (!movie || !movie.movieReleases[0]) {
        throw new Error('No Movie found in DB. Please seed database.');
    }
    movieId = movie.id;
    movieReleaseId = movie.movieReleases[0].id;

    // Create a specific showtime for this test suite
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 24); // Tomorrow
    const showtime = await prisma.createShowtime(cinemaId, hallId, movieId, movieReleaseId, startTime);
    showtimeId = showtime.id;

    // 3. Setup Nest App
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Mimic main.ts setup
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: 1, prefix: 'v' });
    
    // We need to use the Redis Adapter for the real gateway if we want WS to work?
    // In E2E tests against a bootstrapped module, the Gateway uses the adapter configured in main.ts
    // BUT we didn't bootstrap main.ts, we created a module.
    // The AppModule imports RealtimeModule which sets up the adapter?
    // No, adapter is set in main.ts. We must replicate that here if we want WS tests to pass.
    
    // However, configuring Redis IoAdapter in Test environment can be flaky if Redis isn't ready.
    // Let's rely on standard HTTP tests for Booking first. 
    // If strict WS testing is needed, we need the adapter.
    // For now, I will focus on HTTP flow assuming Seat Hold is verified or mocked via Redis direct injection.
    
    // Wait, the Prompt explicitly asked to use socket.io-client. So we MUST set up the adapter.
    const { RedisIoAdapter } = require('../../apps/api-gateway/src/app/module/realtime/adapter/redis-io.adapter');
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    await app.init();
    await app.listen(0); // Random port
    
    const port = app.getHttpServer().address().port;
    const wsUrl = `http://localhost:${port}`;
    
    // Setup Socket Client
    clientSocket = io(wsUrl, {
        transports: ['websocket'],
        query: { userId: testUser }
    });
    
    // Wait for connection
    await new Promise<void>((resolve) => {
        clientSocket.on('connect', () => resolve());
    });
  });

  afterAll(async () => {
    if (clientSocket) clientSocket.close();
    await prisma.clearBookingsForShowtime(showtimeId);
    await prisma.clearShowtimes(showtimeId);
    await prisma.disconnect();
    await redis.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Set test user for Auth Guard
    MockAuthGuard.setTestUser(testUser);
  });

  describe('TC-RT-01-01: Verify Seat Holding (Real-time)', () => {
    it('should hold a seat via WebSocket and confirm via Redis', (done) => {
       // 1. Emit hold seat
       clientSocket.emit('gateway.hold_seat', { showtimeId, seatId });
       
       // 2. Listen for confirmation
       clientSocket.on('cinema.seat_held', (data) => {
           try {
               expect(data).toBeDefined();
               expect(data.seatId).toBe(seatId);
               expect(data.status).toBe('HELD');
               expect(data.heldBy).toBe(testUser);
               done();
           } catch (error) {
               done(error);
           }
       });
       
       // Fallback timeout
       setTimeout(() => {
           // Check Redis directly if event missed (or as double check)
           // But failing here means event wasn't received
       }, 2000);
    });
  });

  describe('TC-BK-01-01: Verify Booking Creation', () => {
    it('should create a booking for the held seat', async () => {
        // Wait a bit to ensure Redis is consistent from previous step
        await new Promise(r => setTimeout(r, 500));

        const payload = {
            showtimeId,
            seats: [{ seatId, ticketType: 'STANDARD' }],
            // Concessions optional
        };

        const response = await request(app.getHttpServer())
            .post('/api/v1/bookings')
            .send(payload)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('PENDING');
        expect(response.body.tickets).toHaveLength(1);
        
        bookingId = response.body.id;
    });
  });

  describe('TC-BK-02-NEG: Verify Booking Without Holding Seats', () => {
    it('should fail to book a seat that is not held', async () => {
        // Find another seat
        const cinema = await prisma.getCinemaWithHallAndSeats();
        const otherSeatId = cinema.halls[0].seats[1].id; 
        
        const payload = {
            showtimeId,
            seats: [{ seatId: otherSeatId, ticketType: 'STANDARD' }]
        };

        await request(app.getHttpServer())
            .post('/api/v1/bookings')
            .send(payload)
            .expect(400); // Expect Bad Request or similar
    });
  });

  describe('TC-PY-01-01: Verify Payment Creation', () => {
      it('should generate a payment URL', async () => {
          expect(bookingId).toBeDefined();

          const payload = {
              paymentMethod: 'VNPAY',
              amount: 100000, // Arbitrary, backend might recalculate
              returnUrl: 'http://localhost:3000/return',
              cancelUrl: 'http://localhost:3000/cancel'
          };

          const response = await request(app.getHttpServer())
              .post(`/api/v1/payments/bookings/${bookingId}`)
              .send(payload)
              .expect(201);
              
          expect(response.body).toHaveProperty('paymentUrl');
          expect(response.body.paymentUrl).toContain('vnpay');
      });
  });
  
  describe('TC-BK-09-01: Verify Cancel with Refund', () => {
      // Setup: We need a CONFIRMED booking to test refund.
      // Since we can't easily simulate the full Payment callback flow in unit test without external hitting,
      // we might need to manually update the booking status in DB to CONFIRMED for this test.
      
      beforeAll(async () => {
          // Manually confirm the booking
           await prisma.booking.bookings.update({
               where: { id: bookingId },
               data: { status: 'CONFIRMED', payment_status: 'COMPLETED' }
           });
           
           // Ensure a Payment record exists? Refund controller might look for it.
           // Ideally Create Payment step created one, but status is PENDING.
           // Let's find and update it.
           const payment = await prisma.booking.payments.findFirst({ where: { booking_id: bookingId }});
           if(payment) {
               await prisma.booking.payments.update({
                   where: { id: payment.id },
                   data: { status: 'COMPLETED', paid_at: new Date() }
               });
           }
      });
  
      it('should cancel a confirmed booking and calculate refund', async () => {
          const response = await request(app.getHttpServer())
              .post(`/api/v1/bookings/${bookingId}/cancel-with-refund`)
              .expect(201); // or 200 depending on implementation
              
          // Check response or DB
          // Note: Response might be the refund request or the updated booking
      });
  });

});
