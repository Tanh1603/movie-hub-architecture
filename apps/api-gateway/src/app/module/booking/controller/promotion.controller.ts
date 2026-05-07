import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { PromotionService } from '../service/promotion.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { OptionalClerkAuthGuard } from '../../../common/guard/optional-clerk-auth.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import {
  PromotionType,
  ValidatePromotionDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from '@movie-hub/shared-types';

@Controller({
  version: '1',
  path: 'promotions',
})
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  async findAll(
    @Query('active') active?: string,
    @Query('type') type?: PromotionType
  ) {
    // Default to active=true for public API if not specified
    const activeFilter = active === 'false' ? false : active === 'undefined' ? undefined : true;
    
    return this.promotionService.findAll(
      activeFilter,
      type
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.promotionService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.promotionService.findByCode(code.trim());
  }

  @Post('validate/:code')
  @UseGuards(OptionalClerkAuthGuard)
  async validate(
    @Param('code') code: string,
    @Body() validateDto: ValidatePromotionDto,
    @CurrentUserId() userId?: string
  ) {
    // Inject userId from auth context into DTO for refund voucher validation
    return this.promotionService.validate(code.trim(), {
      ...validateDto,
      userId,
    });
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionService.create(createPromotionDto);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto
  ) {
    return this.promotionService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async delete(@Param('id') id: string) {
    return this.promotionService.delete(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(ClerkAuthGuard)
  async toggleActive(@Param('id') id: string) {
    return this.promotionService.toggleActive(id);
  }
}
