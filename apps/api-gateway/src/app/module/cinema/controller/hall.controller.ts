import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import {
  CreateHallRequest,
  HallStatusEnum,
  UpdateHallRequest,
  UpdateSeatStatusRequest,
} from '@movie-hub/shared-types';
import { HallService } from '../service/hall.service';
import { lastValueFrom } from 'rxjs';

@Controller({
  version: '1',
  path: 'halls',
})
@UseInterceptors(new TransformInterceptor())
export class HallController {
  constructor(private readonly hallService: HallService) {}

  // CRUD Operations

  @Get('hall/:hallId')
  @UseGuards(ClerkAuthGuard)
  getHallById(@Param('hallId') hallId: string) {
    return this.hallService.getHallById(hallId);
  }

  @Get('cinema/:cinemaId')
  @UseGuards(ClerkAuthGuard)
  getHallsOfCinema(
    @Req() req: any,
    @Param('cinemaId') cinemaId: string,
    @Query('status') status: HallStatusEnum
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId && userCinemaId !== cinemaId) {
      throw new ForbiddenException(
        'You can only view halls of your own cinema'
      );
    }
    const hallStatus = status ?? HallStatusEnum.ACTIVE;
    return this.hallService.getHallsOfCinema(cinemaId, hallStatus);
  }

  /**
   * Create a new hall
   */
  @Post('hall')
  @UseGuards(ClerkAuthGuard)
  //@Permission('hall:create')
  createHall(@Req() req: any, @Body() createHallRequest: CreateHallRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId && createHallRequest.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only create halls for your own cinema'
      );
    }
    return this.hallService.createHall(createHallRequest);
  }

  /**
   * Get hall detail by ID
   */
  @Patch('hall/:hallId')
  @UseGuards(ClerkAuthGuard)
  //@Permission('hall:create')
  async updateHall(
    @Req() req: any,
    @Param('hallId') hallId: string,
    @Body() updateHallDto: UpdateHallRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      // Verify ownership: fetch hall and check cinemaId
      const hallObservable = await this.hallService.getHallById(hallId);
      const hall = await lastValueFrom(hallObservable);
      if (hall?.data?.cinemaId !== userCinemaId) {
        throw new ForbiddenException(
          'You can only update halls for your own cinema'
        );
      }
    }
    return this.hallService.updateHall(hallId, updateHallDto);
  }

  /**
   * Delete a hall by ID
   */
  @Delete('hall/:hallId')
  @UseGuards(ClerkAuthGuard)
  //@Permission('hall:create')
  async deleteHall(@Req() req: any, @Param('hallId') hallId: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      // Verify ownership: fetch hall and check cinemaId
      const hallObservable = await this.hallService.getHallById(hallId);
      const hall = await lastValueFrom(hallObservable);
      if (hall?.data?.cinemaId !== userCinemaId) {
        throw new ForbiddenException(
          'You can only delete halls for your own cinema'
        );
      }
    }
    return this.hallService.deleteHall(hallId);
  }

  /**
   *  Update seat status
   */
  @Patch('seat/:seatId/status')
  @UseGuards(ClerkAuthGuard)
  //@Permission('hall:create')
  async updateSeatStatus(
    @Req() req: any,
    @Param('seatId') seatId: string,
    @Body() updateSeatStatusRequest: UpdateSeatStatusRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      // For seat status updates, we would need to verify the seat belongs to a hall in user's cinema
      // This requires fetching seat details. For now, we trust the hallId context from the request
      // or implement a getSeatById service method. Leaving as TODO if needed.
    }
    return this.hallService.updateSeatStatus(seatId, updateSeatStatusRequest);
  }
}
