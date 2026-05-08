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
import { Permission } from '../../../common/decorator/permission.decorator';
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
  @Permission('booking:cancel')
  async create(@Body() createRefundDto: CreateRefundDto) {
    return this.refundService.createRefund(createRefundDto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:read')
  async findAll(@Query() filters: FindAllRefundsDto) {
    return this.refundService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:read')
  async findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Get('payment/:paymentId')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:read')
  async findByPayment(@Param('paymentId') paymentId: string) {
    return this.refundService.findByPayment(paymentId);
  }

  @Put(':id/process')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:write')
  async process(
    @Param('id') refundId: string,
    @Body() processDto: ProcessRefundDto
  ) {
    return this.refundService.processRefund({ ...processDto, refundId });
  }

  @Put(':id/approve')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:write')
  async approve(
    @Param('id') refundId: string,
    @Body() approveDto: ApproveRefundDto
  ) {
    return this.refundService.approveRefund({ ...approveDto, refundId });
  }

  @Put(':id/reject')
  @UseGuards(ClerkAuthGuard)
  @Permission('booking:write')
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
  @Permission('booking:cancel')
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
