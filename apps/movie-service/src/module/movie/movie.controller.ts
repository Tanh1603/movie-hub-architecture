import {
  CreateMovieReleaseRequest,
  CreateMovieRequest,
  CreateReviewRequest,
  MovieQuery,
  MovieServiceMessage,
  ReviewQuery,
  UpdateMovieReleaseRequest,
  UpdateMovieRequest,
  UpdateReviewRequest,
} from '@movie-hub/shared-types';
import {
  Controller,
  Logger,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MovieService } from './movie.service';
import { AllExceptionsFilter } from '../../filter/all-exceptions.filter';
import { LoggingInterceptor } from '@movie-hub/shared-types/common/logging.interceptor';

@Controller('movies')
@UseFilters(new AllExceptionsFilter())
@UseInterceptors(new LoggingInterceptor('Movie-Service'))
export class MovieController {
  logger = new Logger(MovieController.name);

  constructor(private readonly movieService: MovieService) {}

  @MessagePattern(MovieServiceMessage.MOVIE.GET_LIST)
  async getMovies(@Payload() query: MovieQuery) {
    return this.movieService.getMovies(query);
  }

  @MessagePattern(MovieServiceMessage.MOVIE.GET_DETAIL)
  async getDetail(@Payload() id: string) {
    return this.movieService.getMovieDetail(id);
  }

  @MessagePattern(MovieServiceMessage.MOVIE.CREATED)
  async createMovie(@Payload() request: CreateMovieRequest) {
    return this.movieService.createMovie(request);
  }

  @MessagePattern(MovieServiceMessage.MOVIE.UPDATED)
  async updateMovie(
    @Payload()
    {
      id,
      updateMovieRequest,
    }: {
      id: string;
      updateMovieRequest: UpdateMovieRequest;
    }
  ) {
    return this.movieService.updateMovie(id, updateMovieRequest);
  }

  @MessagePattern(MovieServiceMessage.MOVIE.DELETED)
  async deleteMovie(@Payload() id: string) {
    return this.movieService.deleteMovie(id);
  }

  // CRUD Movie Release Date
  @MessagePattern(MovieServiceMessage.MOVIE.GET_LIST_RELEASE)
  async getMovieRelease(@Payload() movieId: string) {
    return this.movieService.getMovieRelease(movieId);
  }

  @MessagePattern(MovieServiceMessage.MOVIE_RELEASE.CREATED)
  async createMovieRelease(@Payload() request: CreateMovieReleaseRequest) {
    return this.movieService.createMovieRelease(request);
  }
  @MessagePattern(MovieServiceMessage.MOVIE_RELEASE.UPDATED)
  async updateMovieRelease(
    @Payload()
    {
      id,
      updateMovieReleaseRequest,
    }: {
      id: string;
      updateMovieReleaseRequest: UpdateMovieReleaseRequest;
    }
  ) {
    return this.movieService.updateMovieRelease(id, updateMovieReleaseRequest);
  }

  @MessagePattern(MovieServiceMessage.MOVIE_RELEASE.DELETED)
  async deleteMovieRelease(@Payload() id: string) {
    return this.movieService.deleteMovieRelease(id);
  }

  //review
  @MessagePattern(MovieServiceMessage.MOVIE.GET_REVIEWS)
  async getReviews(@Payload() query: ReviewQuery) {
    return this.movieService.getReviewsByMovie(query);
  }

  @MessagePattern(MovieServiceMessage.MOVIE.CREATED_REVIEW)
  async createReview(@Payload() dto: CreateReviewRequest) {
    return this.movieService.createReviewForMovie(dto);
  }

  @MessagePattern(MovieServiceMessage.MOVIE.UPDATED_REVIEW)
  async updateReview(
    @Payload() { id, request }: { id: string; request: UpdateReviewRequest }
  ) {
    return this.movieService.updateReview(id, request);
  }

  // Function for internal microservice
  @MessagePattern(MovieServiceMessage.MOVIE.GET_LIST_BY_ID)
  async getMovieByListId(@Payload() movieIds: string[]) {
    return this.movieService.getMovieByListId(movieIds);
  }
}
