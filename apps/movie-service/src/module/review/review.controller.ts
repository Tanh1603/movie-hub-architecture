import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';

import { MovieQuery, MovieServiceMessage } from '@movie-hub/shared-types';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { AllExceptionsFilter } from '../../filter/all-exceptions.filter';
import { ReviewService } from './review.service';

@Controller('reviews')
@UseFilters(new AllExceptionsFilter())

export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern(MovieServiceMessage.REVIEW.GET_LIST)
  findAll(@Payload() query: MovieQuery) {
    return this.reviewService.findAll(query);
  }

  @MessagePattern(MovieServiceMessage.REVIEW.DELETED)
  remove(@Payload() id: string) {
    return this.reviewService.remove(id);
  }
}
