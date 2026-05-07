import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Promotions } from '../../../generated/prisma';
import {
  PromotionDto,
  PromotionType,
  ValidatePromotionDto,
  ValidatePromotionResponseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  ServiceResult,
} from '@movie-hub/shared-types';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    active?: boolean,
    type?: PromotionType
  ): Promise<ServiceResult<PromotionDto[]>> {
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
      if (active === true) {
        where.valid_from = { lte: new Date() };
        where.valid_to = { gte: new Date() };
      }
    }

    if (type) {
      where.type = type;
    }

    const promotions = await this.prisma.promotions.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return {
      data: promotions.map((p) => this.mapToDto(p)),
    };
  }

  async validatePromotion(
    code: string,
    dto: ValidatePromotionDto
  ): Promise<ServiceResult<ValidatePromotionResponseDto>> {
    const promotion = await this.prisma.promotions.findUnique({
      where: { code },
    });

    if (!promotion) {
      return {
        data: {
          valid: false,
          message: 'Promotion code not found',
        },
      };
    }

    if (!promotion.active) {
      return {
        data: {
          valid: false,
          message: 'Promotion code is not active',
        },
      };
    }

    const now = new Date();
    if (promotion.valid_from > now || promotion.valid_to < now) {
      return {
        data: {
          valid: false,
          message: 'Promotion code has expired',
        },
      };
    }

    if (
      promotion.usage_limit &&
      promotion.current_usage >= promotion.usage_limit
    ) {
      return {
        data: {
          valid: false,
          message: 'Promotion usage limit reached',
        },
      };
    }

    // Check if this is a refund voucher and if it belongs to the requesting user
    const conditions = promotion.conditions as {
      isRefundVoucher?: boolean;
      userId?: string;
    } | null;

    if (conditions?.isRefundVoucher && conditions?.userId) {
      if (!dto.userId || dto.userId !== conditions.userId) {
        return {
          data: {
            valid: false,
            message:
              'This refund voucher can only be used by its original owner',
          },
        };
      }
    }

    if (
      promotion.min_purchase &&
      dto.bookingAmount < Number(promotion.min_purchase)
    ) {
      return {
        data: {
          valid: false,
          message: `Minimum purchase amount is ${promotion.min_purchase}`,
        },
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.type === PromotionType.PERCENTAGE) {
      discountAmount = (dto.bookingAmount * Number(promotion.value)) / 100;
      if (promotion.max_discount) {
        discountAmount = Math.min(
          discountAmount,
          Number(promotion.max_discount)
        );
      }
    } else if (promotion.type === PromotionType.FIXED_AMOUNT) {
      discountAmount = Number(promotion.value);
    }

    // Ensure discount doesn't exceed booking amount
    discountAmount = Math.min(discountAmount, dto.bookingAmount);

    const finalAmount = dto.bookingAmount - discountAmount;

    return {
      data: {
        valid: true,
        promotion: this.mapToDto(promotion),
        discountAmount,
        finalAmount,
        message: 'Promotion code is valid',
      },
    };
  }

  async findOne(id: string): Promise<ServiceResult<PromotionDto>> {
    const promotion = await this.prisma.promotions.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return {
      data: this.mapToDto(promotion),
    };
  }

  async findByCode(code: string): Promise<ServiceResult<PromotionDto>> {
    const promotion = await this.prisma.promotions.findUnique({
      where: { code },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return {
      data: this.mapToDto(promotion),
    };
  }

  async create(dto: CreatePromotionDto): Promise<ServiceResult<PromotionDto>> {
    // Check if promotion code already exists
    const existing = await this.prisma.promotions.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('Promotion code already exists');
    }

    // Convert string dates to Date objects
    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);

    // Validate dates
    if (validFrom >= validTo) {
      throw new BadRequestException(
        'Valid from date must be before valid to date'
      );
    }

    const promotion = await this.prisma.promotions.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        min_purchase: dto.minPurchase,
        max_discount: dto.maxDiscount,
        valid_from: validFrom,
        valid_to: validTo,
        usage_limit: dto.usageLimit,
        usage_per_user: dto.usagePerUser,
        current_usage: 0,
        applicable_for: dto.applicableFor || [],
        conditions: dto.conditions,
        active: dto.active ?? true,
      },
    });

    return {
      data: this.mapToDto(promotion),
      message: 'Promotion created successfully',
    };
  }

  async update(
    id: string,
    dto: UpdatePromotionDto
  ): Promise<ServiceResult<PromotionDto>> {
    // Check if promotion exists
    const existing = await this.prisma.promotions.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }

    // Validate dates if provided
    const validFrom = dto.validFrom
      ? new Date(dto.validFrom)
      : existing.valid_from;
    const validTo = dto.validTo ? new Date(dto.validTo) : existing.valid_to;

    if (validFrom >= validTo) {
      throw new BadRequestException(
        'Valid from date must be before valid to date'
      );
    }

    const promotion = await this.prisma.promotions.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        min_purchase: dto.minPurchase,
        max_discount: dto.maxDiscount,
        valid_from: validFrom,
        valid_to: validTo,
        usage_limit: dto.usageLimit,
        usage_per_user: dto.usagePerUser,
        applicable_for: dto.applicableFor,
        conditions: dto.conditions,
        active: dto.active,
      },
    });

    return {
      data: this.mapToDto(promotion),
      message: 'Promotion updated successfully',
    };
  }

  async delete(id: string): Promise<ServiceResult<{ message: string }>> {
    // Check if promotion exists
    const promotion = await this.prisma.promotions.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Check if promotion is used in any active bookings
    const activeBookings = await this.prisma.bookings.count({
      where: {
        promotion_code: promotion.code,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException(
        'Cannot delete promotion that is used in active bookings. Consider deactivating it instead.'
      );
    }

    await this.prisma.promotions.delete({
      where: { id },
    });

    return {
      data: { message: 'Promotion deleted successfully' },
    };
  }

  async toggleActive(id: string): Promise<ServiceResult<PromotionDto>> {
    const promotion = await this.prisma.promotions.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const updated = await this.prisma.promotions.update({
      where: { id },
      data: {
        active: !promotion.active,
      },
    });

    return {
      data: this.mapToDto(updated),
      message: `Promotion ${
        updated.active ? 'activated' : 'deactivated'
      } successfully`,
    };
  }

  /**
   * Generate a refund voucher for a specific booking
   * Creates a promotion code with 100% of the ticket value, single-use, valid for 1 year
   */
  async generateRefundVoucher(params: {
    userId: string;
    bookingId: string;
    amount: number;
    bookingCode: string;
  }): Promise<ServiceResult<PromotionDto>> {
    const code = `REFUND-${params.bookingCode}-${Date.now()
      .toString(36)
      .toUpperCase()}`;

    const now = new Date();
    const validTo = new Date(now);
    validTo.setFullYear(validTo.getFullYear() + 1); // Valid for 1 year

    const promotion = await this.prisma.promotions.create({
      data: {
        code,
        name: `Refund Voucher - ${params.bookingCode}`,
        description: `Refund voucher for booking ${
          params.bookingCode
        }. Original value: ${params.amount.toLocaleString()} VND`,
        type: PromotionType.FIXED_AMOUNT,
        value: params.amount,
        min_purchase: 0,
        max_discount: params.amount,
        valid_from: now,
        valid_to: validTo,
        usage_limit: 1,
        usage_per_user: 1,
        current_usage: 0,
        applicable_for: ['REFUND'],
        conditions: {
          originalBookingId: params.bookingId,
          userId: params.userId,
          isRefundVoucher: true,
        },
        active: true,
      },
    });

    return {
      data: this.mapToDto(promotion),
      message: `Refund voucher generated successfully. Code: ${code}`,
    };
  }

  public mapToDto(promotion: Promotions): PromotionDto {
    return {
      id: promotion.id,
      code: promotion.code,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type as PromotionType,
      value: Number(promotion.value),
      minPurchase: promotion.min_purchase
        ? Number(promotion.min_purchase)
        : undefined,
      maxDiscount: promotion.max_discount
        ? Number(promotion.max_discount)
        : undefined,
      validFrom: promotion.valid_from,
      validTo: promotion.valid_to,
      usageLimit: promotion.usage_limit,
      usagePerUser: promotion.usage_per_user,
      currentUsage: promotion.current_usage,
      applicableFor: promotion.applicable_for,
      conditions: promotion.conditions as any,
      active: promotion.active,
    };
  }
}
