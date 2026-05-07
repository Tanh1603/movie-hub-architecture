import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TicketPricingService } from '../service/ticket-pricing.service';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';

@Controller({
  version: '1',
  path: 'ticket-pricings',
})
@UseInterceptors(new TransformInterceptor())
export class TicketPricingController {
  constructor(private readonly ticketPricingService: TicketPricingService) {}

  @Get('hall/:hallId')
  async getPricingForHall(@Param('hallId') hallId: string) {
    return await this.ticketPricingService.getPricingForHall(hallId);
  }

  @Patch('pricing/:pricingId')
  @UseGuards(ClerkAuthGuard)
  async updateTicketPricing(
    @Req() req: any,
    @Param('pricingId') pricingId: string,
    @Body('price') price: number
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot update ticket pricing');
    }
    return await this.ticketPricingService.updateTicketPricing(
      pricingId,
      price
    );
  }
}
