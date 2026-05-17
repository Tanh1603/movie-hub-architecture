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
import { ClerkSyncService } from './clerk-sync.service';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkSyncService: ClerkSyncService
  ) {}

  async create(
    createStaffDto: CreateStaffRequest
  ): Promise<ServiceResult<StaffResponse>> {
    const staff = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staff.upsert({
        where: { email: createStaffDto.email },
        update: {
          fullName: createStaffDto.fullName,
          phone: createStaffDto.phone,
          gender: createStaffDto.gender as unknown as Gender,
          dob: createStaffDto.dob,
          position: createStaffDto.position as unknown as StaffPosition,
          status: createStaffDto.status as unknown as StaffStatus,
          workType: createStaffDto.workType as unknown as WorkType,
          shiftType: createStaffDto.shiftType as unknown as ShiftType,
          salary: createStaffDto.salary,
          hireDate: createStaffDto.hireDate,
          cinemaId: createStaffDto.cinemaId,
        },
        create: {
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

      await this.clerkSyncService.enqueueUpsert(
        {
          email: createStaffDto.email,
          fullName: createStaffDto.fullName,
          position: createStaffDto.position,
          cinemaId: createStaffDto.cinemaId,
          status: createStaffDto.status,
        },
        tx
      );

      return created;
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
    const staff = await this.prisma.$transaction(async (tx) => {
      const current = await tx.staff.findUnique({
        where: { id },
        select: {
          email: true,
          fullName: true,
          cinemaId: true,
          status: true,
          position: true,
        },
      });
      if (!current) {
        throw new RpcException({
          summary: 'Update staff failed',
          statusCode: 404,
          code: 'STAFF_NOT_FOUND',
          message: 'Staff does not exist',
        });
      }

      const updated = await tx.staff.update({
        where: { id },
        data: {
          fullName: updateStaffDto.fullName ?? undefined,
          phone: updateStaffDto.phone ?? undefined,
          gender: (updateStaffDto.gender as unknown as Gender) ?? undefined,
          dob: updateStaffDto.dob ?? undefined,
          position:
            (updateStaffDto.position as unknown as StaffPosition) ?? undefined,
          status:
            (updateStaffDto.status as unknown as StaffStatus) ?? undefined,
          workType:
            (updateStaffDto.workType as unknown as WorkType) ?? undefined,
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

      await this.clerkSyncService.enqueueUpsert(
        {
          email: current.email,
          fullName: updateStaffDto.fullName ?? current.fullName,
          position: String(updateStaffDto.position ?? current.position),
          cinemaId: current.cinemaId,
          status: String(updateStaffDto.status ?? current.status),
        },
        tx
      );

      return updated;
    });

    return {
      data: staff as unknown as StaffResponse,
    };
  }

  async remove(id: string): Promise<ServiceResult<void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.staff.findUnique({
          where: { id },
          select: { email: true },
        });

        if (!existing) {
          throw new RpcException({
            summary: 'Delete staff failed',
            statusCode: 404,
            code: 'STAFF_NOT_FOUND',
            message: 'Staff does not exist',
          });
        }

        await tx.staff.delete({
          where: { id },
        });

        await this.clerkSyncService.enqueueDelete({ email: existing.email }, tx);
      });

      return {
        data: undefined,
        message: 'Delete staff successfully!',
      };
    } catch (e) {
      if (e instanceof RpcException) {
        throw e;
      }

      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new RpcException({
            summary: 'Delete staff failed',
            statusCode: 404,
            code: 'STAFF_NOT_FOUND',
            message: 'Staff does not exist',
          });
        }

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

      throw new RpcException({
        summary: 'Delete staff failed',
        statusCode: 500,
        code: 'DELETE_STAFF_FAILED',
        message: 'Unexpected error occurred while deleting staff',
      });
    }
  }
}
