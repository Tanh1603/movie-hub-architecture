import {
  CreateMovieRequest,
  CreateReviewRequest,
  MovieQuery,
  ReviewQuery,
  UpdateMovieRequest,
  UpdateReviewRequest,
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
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { MovieService } from '../service/movie.service';

@Controller({
  version: '1',
  path: 'movies',
})
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  async getMovies(@Query() query: MovieQuery) {
    return this.movieService.getMovies(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.movieService.getMovieDetail(id);
  }

  @Get(':id/releases')
  async getMovieRelease(@Param('id') id: string) {
    return this.movieService.getMovieRelease(id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  async createMovie(@Req() req: any, @Body() request: CreateMovieRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot create movies');
    }
    return this.movieService.createMovie(request);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async updateMovie(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: UpdateMovieRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot update movies');
    }
    return this.movieService.updateMovie(id, request);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot delete movies');
    }
    await this.movieService.deleteMovie(id);
    return null;
  }

  // reviews
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string, @Query() query: ReviewQuery) {
    query.movieId = id;
    return this.movieService.getReviews(query);
  }

  @Post(':id/reviews')
  async createReview(
    @Param('id') id: string,
    @Body() request: CreateReviewRequest
  ) {
    request.movieId = id;
    return this.movieService.createReviews(request);
  }

  @Put(':id/reviews/:reviewId')
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() request: UpdateReviewRequest
  ) {
    return this.movieService.updateReview(reviewId, request);
  }
}
