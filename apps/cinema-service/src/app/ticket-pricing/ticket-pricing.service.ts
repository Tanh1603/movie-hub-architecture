import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ResponseMessage,
  TicketPricingResponse,
} from '@movie-hub/shared-types';
import { TicketPricingMapper } from './ticket-pricing.mapper';
import { ServiceResult } from '@movie-hub/shared-types/common';

@Injectable()
export class TicketPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getPricingForHall(
    hallId: string
  ): Promise<ServiceResult<TicketPricingResponse[]>> {
    const pricings = await this.prisma.ticketPricing.findMany({
      where: { hall_id: hallId },
    });
    return {
      data: TicketPricingMapper.toTicketPricingResponses(pricings),
      message: ResponseMessage.MSG_7,
    };
  }

  async updateTicketPricing(
    pricingId: string,
    price: number
  ): Promise<ServiceResult<TicketPricingResponse>> {
    const updatedPricing = await this.prisma.ticketPricing.update({
      where: { id: pricingId },
      data: { price },
    });
    return {
      data: TicketPricingMapper.toTicketPricingResponse(updatedPricing),
      message: ResponseMessage.MSG_7,
    };
  }
}
