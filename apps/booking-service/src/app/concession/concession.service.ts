import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ConcessionDto,
  ConcessionCategory,
  CreateConcessionDto,
  UpdateConcessionDto,
  ServiceResult,
} from '@movie-hub/shared-types';
import { ConcessionCategory as PrismaConcessionCategory } from '../../../generated/prisma';

@Injectable()
export class ConcessionService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    cinemaId?: string,
    category?: ConcessionCategory,
    available = true
  ): Promise<ServiceResult<ConcessionDto[]>> {
    const where: any = {};
    const normalizedCinemaId = this.optionalUuid(cinemaId, 'cinemaId');

    if (normalizedCinemaId) {
      where.OR = [{ cinema_id: normalizedCinemaId }, { cinema_id: null }];
    } else {
      // When no cinema filter is provided, only show "all cinemas" items
      where.cinema_id = null;
    }

    if (category) {
      where.category = category;
    }

    if (available !== undefined) {
      where.available = available;
    }

    const concessions = await this.prisma.concessions.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      data: concessions.map((c) => this.mapToDto(c)),
    };
  }

  async findOne(id: string): Promise<ServiceResult<ConcessionDto>> {
    const concessionId = this.requireUuid(id, 'id');
    const concession = await this.prisma.concessions.findUnique({
      where: { id: concessionId },
    });

    if (!concession) {
      throw new NotFoundException('Concession not found');
    }

    return {
      data: this.mapToDto(concession),
    };
  }

  async create(
    dto: CreateConcessionDto
  ): Promise<ServiceResult<ConcessionDto>> {
    const normalizedCinemaId = this.optionalUuid(dto.cinemaId, 'cinemaId');

    // Check if concession with same name exists in same cinema
    if (normalizedCinemaId) {
      const existing = await this.prisma.concessions.findFirst({
        where: {
          name: dto.name,
          cinema_id: normalizedCinemaId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Concession with this name already exists in this cinema'
        );
      }
    }

    const concession = await this.prisma.concessions.create({
      data: {
        name: dto.name,
        name_en: dto.nameEn,
        description: dto.description,
        category: dto.category as PrismaConcessionCategory,
        price: dto.price,
        image_url: dto.imageUrl,
        available: dto.available ?? true,
        inventory: dto.inventory,
        cinema_id: normalizedCinemaId,
        nutrition_info: dto.nutritionInfo,
        // DB column is required; default to empty array when client omits it
        allergens: dto.allergens ?? [],
      },
    });

    return {
      data: this.mapToDto(concession),
      message: 'Concession created successfully',
    };
  }

  async update(
    id: string,
    dto: UpdateConcessionDto
  ): Promise<ServiceResult<ConcessionDto>> {
    const concessionId = this.requireUuid(id, 'id');
    const normalizedCinemaId = this.optionalUuid(dto.cinemaId, 'cinemaId');

    // Check if concession exists
    const existing = await this.prisma.concessions.findUnique({
      where: { id: concessionId },
    });

    if (!existing) {
      throw new NotFoundException('Concession not found');
    }

    // Check if updating name would create duplicate
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.concessions.findFirst({
        where: {
          name: dto.name,
          cinema_id: existing.cinema_id,
          id: { not: concessionId },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Concession with this name already exists in this cinema'
        );
      }
    }

    const concession = await this.prisma.concessions.update({
      where: { id: concessionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEn !== undefined && { name_en: dto.nameEn }),
        ...('description' in dto && { description: dto.description }),
        ...(dto.category !== undefined && {
          category: dto.category as PrismaConcessionCategory,
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
        ...(dto.available !== undefined && { available: dto.available }),
        ...(dto.inventory !== undefined && { inventory: dto.inventory }),
        ...(normalizedCinemaId !== undefined && {
          cinema_id: normalizedCinemaId,
        }),
        ...('nutritionInfo' in dto && {
          nutrition_info: dto.nutritionInfo,
        }),
        ...('allergens' in dto && { allergens: dto.allergens ?? [] }),
      },
    });

    return {
      data: this.mapToDto(concession),
      message: 'Concession updated successfully',
    };
  }

  async delete(id: string): Promise<ServiceResult<{ message: string }>> {
    const concessionId = this.requireUuid(id, 'id');

    // Check if concession exists
    const concession = await this.prisma.concessions.findUnique({
      where: { id: concessionId },
    });

    if (!concession) {
      throw new NotFoundException('Concession not found');
    }

    // Check if concession is used in any active bookings
    const activeBookings = await this.prisma.bookingConcessions.count({
      where: {
        concession_id: concessionId,
        booking: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException(
        'Cannot delete concession that is used in active bookings. Consider marking it as unavailable instead.'
      );
    }

    await this.prisma.concessions.delete({
      where: { id: concessionId },
    });

    return {
      data: { message: 'Concession deleted successfully' },
    };
  }

  async updateInventory(
    id: string,
    quantity: number
  ): Promise<ServiceResult<ConcessionDto>> {
    const concessionId = this.requireUuid(id, 'id');
    const concession = await this.prisma.concessions.findUnique({
      where: { id: concessionId },
    });

    if (!concession) {
      throw new NotFoundException('Concession not found');
    }

    const updated = await this.prisma.concessions.update({
      where: { id: concessionId },
      data: {
        inventory: concession.inventory
          ? concession.inventory + quantity
          : quantity,
        available: concession.inventory && concession.inventory + quantity > 0,
      },
    });

    return {
      data: this.mapToDto(updated),
      message: 'Inventory updated successfully',
    };
  }

  private mapToDto(concession: any): ConcessionDto {
    return {
      id: concession.id,
      name: concession.name,
      nameEn: concession.name_en,
      description: concession.description,
      category: concession.category as ConcessionCategory,
      price: Number(concession.price),
      imageUrl: concession.image_url,
      available: concession.available,
      inventory: concession.inventory,
      cinemaId: concession.cinema_id,
      nutritionInfo: concession.nutrition_info,
      allergens: concession.allergens,
    };
  }

  private optionalUuid(
    value: string | undefined,
    fieldName: string
  ): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'all') return undefined;
    if (!this.isValidUuid(trimmed)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
    return trimmed;
  }

  private requireUuid(value: string, fieldName: string): string {
    const normalized = this.optionalUuid(value, fieldName);
    if (!normalized) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
    return normalized;
  }

  private isValidUuid(value: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      value
    );
  }
}
