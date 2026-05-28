import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from '../service/booking.service';
import { NotFoundException } from '@nestjs/common';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { RoleGuard } from '../../../common/guard/role.guard';

describe('BookingController - Ownership Security Gates', () => {
  let controller: BookingController;
  let bookingService: jest.Mocked<BookingService>;

  beforeEach(async () => {
    bookingService = {
      findOne: jest.fn(),
      getAdminBookingContext: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: bookingService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should return 404 NotFoundException when a customer attempts to read a booking belonging to another user', async () => {
    const maliciousUserId = 'user_attacker_123';
    const targetBookingId = 'booking_victim_456';

    bookingService.findOne.mockRejectedValue(
      new NotFoundException('Booking not found')
    );

    await expect(
      controller.findOne(maliciousUserId, targetBookingId)
    ).rejects.toThrow(NotFoundException);

    expect(bookingService.findOne).toHaveBeenCalledWith(
      targetBookingId,
      maliciousUserId
    );
  });

  it('should return 404 NotFoundException when a cinema manager attempts to update a booking outside their cinema', async () => {
    const targetBookingId = 'booking_other_cinema_456';
    const req = {
      staffContext: { cinemaId: 'cinema_1' },
    };

    bookingService.getAdminBookingContext.mockResolvedValue({
      id: targetBookingId,
      cinemaId: 'cinema_2', // Belongs to a different cinema
    } as any);

    await expect(
      controller.updateStatus(req, targetBookingId, 'CANCELLED' as any)
    ).rejects.toThrow(NotFoundException);

    expect(bookingService.getAdminBookingContext).toHaveBeenCalledWith(
      targetBookingId
    );
  });
});
