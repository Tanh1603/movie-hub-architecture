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
  UsePipes,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ShowtimeService } from '../service/showtime.service';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import {
  AdminShowtimeFilterDTO,
  BatchCreateShowtimesInput,
  batchCreateShowtimesSchema,
  CreateShowtimeRequest,
  createShowtimeSchema,
  UpdateShowtimeRequest,
} from '@movie-hub/shared-types';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller({
  version: '1',
  path: 'showtimes',
})
@UseInterceptors(new TransformInterceptor())
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  getShowtimes(@Req() req: any, @Query() filter: AdminShowtimeFilterDTO) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      // Force filter to user's cinema
      filter.cinemaId = userCinemaId;
    }
    return this.showtimeService.getShowtimes(filter);
  }

  @Get(':id/seats')
  @UseGuards(ClerkAuthGuard)
  getShowtimeSeats(
    @Param('id') showtimeId: string,
    @CurrentUserId() userId: string
  ) {
    return this.showtimeService.getShowtimeSeats(showtimeId, userId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  getShowtime(@Param('id') showtimeId: string) {
    return this.showtimeService.getShowtime(showtimeId);
  }

  @Get('showtime/:showtimeId/ttl')
  @UseGuards(ClerkAuthGuard)
  getSessionTTL(
    @Param('showtimeId') showtimeId: string,
    @CurrentUserId() userId: string
  ) {
    return this.showtimeService.getSessionTTL(showtimeId, userId);
  }

  @Post('showtime')
  @UseGuards(ClerkAuthGuard)
  @UsePipes(new ZodValidationPipe(createShowtimeSchema))
  createShowtime(@Req() req: any, @Body() body: CreateShowtimeRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId && body.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only create showtimes for your own cinema'
      );
    }
    return this.showtimeService.createShowtime(body);
  }

  @Post('/batch')
  @UseGuards(ClerkAuthGuard)
  @UsePipes(new ZodValidationPipe(batchCreateShowtimesSchema))
  createBatchShowtimes(
    @Req() req: any,
    @Body() body: BatchCreateShowtimesInput
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId && body.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only create showtimes for your own cinema'
      );
    }
    return this.showtimeService.createBatchShowtimes(body);
  }

  @Patch('/showtime/:id')
  @UseGuards(ClerkAuthGuard)
  async updateShowtime(
    @Req() req: any,
    @Param('id') showtimeId: string,
    @Body() updateData: UpdateShowtimeRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      // Verify ownership: fetch showtime and check cinemaId
      const showtime = await this.showtimeService.getShowtime(showtimeId);
      if (showtime?.data?.cinemaId !== userCinemaId) {
        throw new ForbiddenException(
          'You can only update showtimes for your own cinema'
        );
      }
    }
    return this.showtimeService.updateShowtime(showtimeId, updateData);
  }

  @Delete('/showtime/:id')
  @UseGuards(ClerkAuthGuard)
  async deleteShowtime(@Req() req: any, @Param('id') showtimeId: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      // Verify ownership: fetch showtime and check cinemaId
      const showtime = await this.showtimeService.getShowtime(showtimeId);
      if (showtime?.data?.cinemaId !== userCinemaId) {
        throw new ForbiddenException(
          'You can only delete showtimes for your own cinema'
        );
      }
    }
    return this.showtimeService.deleteShowtime(showtimeId);
  }
}
