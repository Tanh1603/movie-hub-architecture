import { ReviewQuery } from '@movie-hub/shared-types';
import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { ReviewService } from '../service/review.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';

@Controller({
  version: '1',
  path: 'reviews',
})
@UseInterceptors(new TransformInterceptor())
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async findAll(@Query() query: ReviewQuery) {
    return this.reviewService.findAll(query);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot delete reviews');
    }
    return this.reviewService.remove(id);
  }
}
