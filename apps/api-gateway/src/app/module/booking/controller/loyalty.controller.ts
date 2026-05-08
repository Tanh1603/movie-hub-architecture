import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LoyaltyService } from '../service/loyalty.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import { Permission } from '../../../common/decorator/permission.decorator';
import { LoyaltyTransactionType } from '@movie-hub/shared-types';

@Controller({
  version: '1',
  path: 'loyalty',
})
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * Get user's loyalty balance and tier
   * Authenticated endpoint
   */
  @Get('balance')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:read')
  async getBalance(@CurrentUserId() userId: string) {
    return this.loyaltyService.getBalance(userId);
  }

  /**
   * Get loyalty transaction history
   * Authenticated endpoint - supports filtering and pagination
   */
  @Get('transactions')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:read')
  async getTransactions(
    @CurrentUserId() userId: string,
    @Query('type') type?: LoyaltyTransactionType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ) {
    return this.loyaltyService.getTransactions(userId, type, page, limit);
  }

  /**
   * Earn loyalty points (usually called internally after booking)
   * This can also be used for manual point adjustments by admins
   */
  @Post('earn')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:write')
  @HttpCode(HttpStatus.OK)
  async earnPoints(
    @CurrentUserId() userId: string,
    @Body('points') points: number,
    @Body('transactionId') transactionId?: string,
    @Body('description') description?: string
  ) {
    return this.loyaltyService.earnPoints(
      userId,
      points,
      transactionId,
      description
    );
  }

  /**
   * Redeem loyalty points for discounts
   * This is typically called during booking creation
   */
  @Post('redeem')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:write')
  @HttpCode(HttpStatus.OK)
  async redeemPoints(
    @CurrentUserId() userId: string,
    @Body('points') points: number,
    @Body('transactionId') transactionId?: string,
    @Body('description') description?: string
  ) {
    return this.loyaltyService.redeemPoints(
      userId,
      points,
      transactionId,
      description
    );
  }
}
