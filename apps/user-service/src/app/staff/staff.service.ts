import { Injectable } from '@nestjs/common';

import {
  CreateStaffRequest,
  ServiceResult,
  StaffQuery,
  StaffResponse,
  UpdateStaffRequest,
} from '@movie-hub/shared-types';
import { PrismaService } from '../prisma.service';
import {
  Gender,
  ShiftType,
  StaffPosition,
  StaffStatus,
  WorkType,
  Prisma,
} from '../../../generated/prisma';
import { PrismaClientKnownRequestError } from '../../../generated/prisma/runtime/library';
import { RpcException } from '@nestjs/microservices';
@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(
    createStaffDto: CreateStaffRequest
  ): Promise<ServiceResult<StaffResponse>> {
    const staff = await this.prisma.staff.create({
      data: {
        cinemaId: createStaffDto.cinemaId,
        fullName: createStaffDto.fullName,
        email: createStaffDto.email,
        phone: createStaffDto.phone,
        gender: createStaffDto.gender as unknown as Gender,
        dob: createStaffDto.dob,
        position: createStaffDto.position as unknown as StaffPosition,
        status: createStaffDto.status as unknown as StaffStatus,
        workType: createStaffDto.workType as unknown as WorkType,
        shiftType: createStaffDto.shiftType as unknown as ShiftType,
        salary: createStaffDto.salary,
        hireDate: createStaffDto.hireDate,
      },
      select: {
        id: true,
        cinemaId: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dob: true,
        position: true,
        status: true,
        workType: true,
        shiftType: true,
        salary: true,
        hireDate: true,
      },
    });

    return {
      data: staff as unknown as StaffResponse,
      message: 'Create staff successfully!',
    };
  }

  async findAll(query: StaffQuery): Promise<ServiceResult<StaffResponse[]>> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.StaffWhereInput = {
      ...(query.cinemaId && { cinemaId: query.cinemaId }),
      ...(query.gender && {
        gender: { equals: query.gender as unknown as Gender },
      }),
      ...(query.position && {
        position: { equals: query.position as unknown as StaffPosition },
      }),
      ...(query.status && {
        status: { equals: query.status as unknown as StaffStatus },
      }),
      ...(query.workType && {
        workType: query.workType as unknown as WorkType,
      }),
      ...(query.shiftType && {
        shiftType: query.shiftType as unknown as ShiftType,
      }),

      ...(query.fullName && {
        fullName: {
          contains: query.fullName,
          mode: 'insensitive',
        },
      }),

      ...(query.dob && {
        dob: query.dob,
      }),
    };

    const [staffs, totalRecords] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder ?? 'asc' }
          : { createdAt: 'desc' },
      }),
      this.prisma.staff.count({ where }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: staffs as unknown as StaffResponse[],
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async findOne(id: string): Promise<ServiceResult<StaffResponse>> {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        cinemaId: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dob: true,
        position: true,
        status: true,
        workType: true,
        shiftType: true,
        salary: true,
        hireDate: true,
      },
    });

    return {
      data: staff as unknown as StaffResponse,
    };
  }

  async findByEmail(email: string): Promise<ServiceResult<StaffResponse>> {
    const staff = await this.prisma.staff.findFirst({
      where: { email },
      select: {
        id: true,
        cinemaId: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dob: true,
        position: true,
        status: true,
        workType: true,
        shiftType: true,
        salary: true,
        hireDate: true,
      },
    });

    if (!staff) {
      throw new RpcException({
        summary: 'Staff not found',
        statusCode: 404,
        code: 'STAFF_NOT_FOUND',
        message: 'Staff not found',
      });
    }

    return {
      data: staff as unknown as StaffResponse,
    };
  }

  async update(
    id: string,
    updateStaffDto: UpdateStaffRequest
  ): Promise<ServiceResult<StaffResponse>> {
    const staff = await this.prisma.staff.update({
      where: { id },
      data: {
        fullName: updateStaffDto.fullName ?? undefined,
        phone: updateStaffDto.phone ?? undefined,
        gender: (updateStaffDto.gender as unknown as Gender) ?? undefined,
        dob: updateStaffDto.dob ?? undefined,
        position:
          (updateStaffDto.position as unknown as StaffPosition) ?? undefined,
        status: (updateStaffDto.status as unknown as StaffStatus) ?? undefined,
        workType: (updateStaffDto.workType as unknown as WorkType) ?? undefined,
        shiftType:
          (updateStaffDto.shiftType as unknown as ShiftType) ?? undefined,
        salary: updateStaffDto.salary,
        hireDate: updateStaffDto.hireDate,
      },
      select: {
        id: true,
        cinemaId: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dob: true,
        position: true,
        status: true,
        workType: true,
        shiftType: true,
        salary: true,
        hireDate: true,
      },
    });

    return {
      data: staff as unknown as StaffResponse,
    };
  }

  async remove(id: string): Promise<ServiceResult<void>> {
    try {
      await this.prisma.staff.delete({
        where: { id },
      });
      return {
        data: undefined,
        message: 'Delete staff successfully!',
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Không tồn tại
        if (e.code === 'P2025') {
          throw new RpcException({
            summary: 'Delete staff failed',
            statusCode: 404,
            code: 'STAFF_NOT_FOUND',
            message: 'Staff does not exist',
          });
        }

        // Bị ràng buộc FK (có liên quan đến booking hoặc cinema)
        if (e.code === 'P2003') {
          throw new RpcException({
            summary: 'Delete staff failed',
            statusCode: 400,
            code: 'STAFF_IN_USE',
            message:
              'Staff cannot be deleted because it is referenced by bookings or other entities',
          });
        }
      }

      // Fallback
      throw new RpcException({
        summary: 'Delete staff failed',
        statusCode: 500,
        code: 'DELETE_STAFF_FAILED',
        message: 'Unexpected error occurred while deleting staff',
      });
    }
  }
}
