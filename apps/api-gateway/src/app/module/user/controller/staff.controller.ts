import {
  CreateStaffRequest,
  StaffQuery,
  UpdateStaffRequest,
} from '@movie-hub/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { StaffService } from '../service/staff.service';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';

@Controller({
  version: '1',
  path: 'staffs',
})
@UseInterceptors(new TransformInterceptor())
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(@Req() req: any, @Body() request: CreateStaffRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId && request.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only create staff for your own cinema'
      );
    }
    return this.staffService.create(request);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  async findAll(@Req() req: any, @Query() query: StaffQuery) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      query.cinemaId = userCinemaId;
    }
    return this.staffService.findAll(query);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    const staff = await this.staffService.findOne(id);
    if (userCinemaId && staff?.data?.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only view staff from your own cinema'
      );
    }
    return staff;
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: UpdateStaffRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      const staff = await this.staffService.findOne(id);
      if (staff?.data?.cinemaId !== userCinemaId) {
        throw new ForbiddenException(
          'You can only update staff from your own cinema'
        );
      }
    }
    return this.staffService.update(id, request);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      const staff = await this.staffService.findOne(id);
      if (staff?.data?.cinemaId !== userCinemaId) {
        throw new ForbiddenException(
          'You can only delete staff from your own cinema'
        );
      }
    }
    return this.staffService.remove(id);
  }
}
