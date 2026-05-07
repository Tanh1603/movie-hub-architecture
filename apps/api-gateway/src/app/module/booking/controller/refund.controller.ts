import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RefundService } from '../service/refund.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import {
  CreateRefundDto,
  FindAllRefundsDto,
  ProcessRefundDto,
  ApproveRefundDto,
  RejectRefundDto,
} from '@movie-hub/shared-types';

@Controller({
  version: '1',
  path: 'refunds',
})
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(@Body() createRefundDto: CreateRefundDto) {
    return this.refundService.createRefund(createRefundDto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  async findAll(@Query() filters: FindAllRefundsDto) {
    return this.refundService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Get('payment/:paymentId')
  @UseGuards(ClerkAuthGuard)
  async findByPayment(@Param('paymentId') paymentId: string) {
    return this.refundService.findByPayment(paymentId);
  }

  @Put(':id/process')
  @UseGuards(ClerkAuthGuard)
  async process(
    @Param('id') refundId: string,
    @Body() processDto: ProcessRefundDto
  ) {
    return this.refundService.processRefund({ ...processDto, refundId });
  }

  @Put(':id/approve')
  @UseGuards(ClerkAuthGuard)
  async approve(
    @Param('id') refundId: string,
    @Body() approveDto: ApproveRefundDto
  ) {
    return this.refundService.approveRefund({ ...approveDto, refundId });
  }

  @Put(':id/reject')
  @UseGuards(ClerkAuthGuard)
  async reject(
    @Param('id') refundId: string,
    @Body() rejectDto: RejectRefundDto
  ) {
    return this.refundService.rejectRefund({ ...rejectDto, refundId });
  }

  /**
   * Request refund as voucher (24-hour policy)
   * User receives a voucher code for 100% of ticket value
   */
  @Post('booking/:bookingId/voucher')
  @UseGuards(ClerkAuthGuard)
  async processAsVoucher(
    @Param('bookingId') bookingId: string,
    @Req() req: { userId: string },
    @Body() dto: { reason?: string }
  ) {
    return this.refundService.processAsVoucher(
      bookingId,
      req.userId,
      dto?.reason
    );
  }
}
