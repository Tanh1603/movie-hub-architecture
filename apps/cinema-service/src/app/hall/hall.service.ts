import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateHallRequest,
  HallDetailResponse,
  HallStatusEnum,
  HallSummaryResponse,
  ResourceNotFoundException,
  UpdateHallRequest,
  UpdateSeatStatusRequest,
} from '@movie-hub/shared-types';
import { ServiceResult } from '@movie-hub/shared-types/common';
import { HallMapper } from './hall.mapper';
import { AutoPricingGenerator } from './pricing-ticket-template';
import { CinemaStatus, SeatStatus } from '../../../generated/prisma';
import { RpcException } from '@nestjs/microservices';
import { PrismaClientKnownRequestError } from '../../../generated/prisma/runtime/library';

@Injectable()
export class HallService {
  constructor(private readonly prisma: PrismaService) {}

  async getHallById(id: string): Promise<ServiceResult<HallDetailResponse>> {
    const hall = await this.prisma.halls.findUnique({
      where: { id },
      include: { seats: true },
    });
    if (!hall) {
      throw new ResourceNotFoundException('Hall', 'id', id);
    }
    return {
      data: HallMapper.toDetailResponse(hall),
      message: 'Get hall successfully!',
    };
  }

  async getHallsOfCinema(
    cinemaId: string,
    status: HallStatusEnum
  ): Promise<ServiceResult<HallSummaryResponse[]>> {
    const halls = await this.prisma.halls.findMany({
      where: { cinema_id: cinemaId, status: status },
      include: { seats: true },
    });
    return {
      data: halls.map(HallMapper.toSummaryResponse),
      message: 'Get halls of cinema successfully!',
    };
  }

  async createHall(
    createHallDto: CreateHallRequest
  ): Promise<ServiceResult<HallDetailResponse>> {
    try {
      const hall = await this.prisma.$transaction(async (db) => {
        const cinema = await this.prisma.cinemas.findUnique({
          where: { id: createHallDto.cinemaId },
          select: { status: true },
        });

        if (!cinema) {
          throw new RpcException({
            summary: 'Cinema not found',
            statusCode: 409,
            code: 'CINEMA_NOT_FOUND',
            message: 'Cinema not found',
          });
        }

        if (cinema.status !== CinemaStatus.ACTIVE) {
          throw new RpcException({
            summary: 'Cinema inactive',
            statusCode: 409,
            code: 'CINEMA_INACTIVE',
            message: 'Cinema is not active',
          });
        }

        const newHall = await db.halls.create({
          data: HallMapper.toHallCreate(createHallDto),
          include: { seats: true },
        });

        // Lấy seatTypes unique từ seats đã sinh
        const seatTypes = [...new Set(newHall.seats.map((s) => s.type))];

        // Tạo bảng giá mặc định
        const pricingItems = AutoPricingGenerator.generate(
          newHall.id,
          seatTypes
        );

        // Insert pricing
        await db.ticketPricing.createMany({
          data: pricingItems,
        });

        return newHall;
      });

      return {
        data: HallMapper.toDetailResponse(hall),
        message: 'Create hall successfully!',
      };
    } catch (e) {
      if (e instanceof RpcException) {
        throw e;
      }
      throw new RpcException(e);
    }
  }

  async updateHall(
    id: string,
    updateHallRequest: UpdateHallRequest
  ): Promise<ServiceResult<HallDetailResponse>> {
    const existingHall = await this.prisma.halls.findUnique({
      where: { id },
    });

    if (!existingHall) {
      throw new ResourceNotFoundException('Hall', 'id', id);
    }

    const updatedHall = await this.prisma.$transaction(async (db) => {
      return await db.halls.update({
        data: HallMapper.toHallUpdate(updateHallRequest),
        where: {
          id: id,
        },
      });
    });

    return {
      data: HallMapper.toDetailResponse(updatedHall),
      message: 'Update hall successfully!',
    };
  }

  async deleteHall(id: string): Promise<ServiceResult<void>> {
    try {
      const [showtimeCount, bookingCount] = await Promise.all([
        this.prisma.showtimes.count({
          where: { hall_id: id },
        }),
        this.prisma.seatReservations.count({
          where: {
            showtime: {
              hall_id: id,
            },
          },
        }),
      ]);

      if (showtimeCount > 0 || bookingCount > 0) {
        throw new RpcException('Cannot delete hall with dependent data');
      }

      await this.prisma.halls.delete({
        where: { id },
      });

      return {
        data: undefined,
        message: 'Delete hall successfully!',
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new RpcException({
            summary: 'Delete hall failed',
            statusCode: 404,
            code: 'HALL_NOT_FOUND',
            message: 'Hall does not exist',
          });
        }
      }

      if (e instanceof RpcException) {
        throw new RpcException({
          summary: 'Delete hall failed',
          statusCode: 400,
          code: 'HALL_IN_USE',
          message: 'Cannot delete hall with dependent data',
        });
      }

      throw new RpcException({
        summary: 'Delete hall failed',
        statusCode: 500,
        code: 'DELETE_HALL_FAILED',
        message: 'Unexpected error occurred while deleting hall',
      });
    }
  }

  async updateSeatStatus(
    seatId: string,
    updateSeatStatusRequest: UpdateSeatStatusRequest
  ): Promise<ServiceResult<void>> {
    const seat = await this.prisma.seats.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    await this.prisma.seats.update({
      where: { id: seatId },
      data: {
        status: updateSeatStatusRequest.status as SeatStatus,
      },
    });

    return {
      message: 'Seat updated successfully',
      data: undefined,
    };
  }

  /**
   * Get hall capacities for all halls (or filtered by cinema IDs)
   * Used for occupancy rate calculations in dashboard
   */
  async getHallCapacities(cinemaIds?: string[]): Promise<
    Array<{
      hallId: string;
      hallName: string;
      cinemaId: string;
      cinemaName: string;
      capacity: number;
    }>
  > {
    const where =
      cinemaIds && cinemaIds.length > 0
        ? { cinema_id: { in: cinemaIds }, status: 'ACTIVE' as const }
        : { status: 'ACTIVE' as const };

    const halls = await this.prisma.halls.findMany({
      where,
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            seats: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    return halls.map((hall) => ({
      hallId: hall.id,
      hallName: hall.name,
      cinemaId: hall.cinema_id,
      cinemaName: hall.cinema?.name || '',
      capacity: hall._count?.seats || 0,
    }));
  }
}
