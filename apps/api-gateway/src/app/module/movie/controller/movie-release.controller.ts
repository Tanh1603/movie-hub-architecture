import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { MovieService } from '../service/movie.service';
import { CreateMovieReleaseRequest } from '@movie-hub/shared-types';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';

@Controller({
  version: '1',
  path: 'movie-releases',
})
export class MovieReleaseController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async createMovieRelease(
    @Req() req: any,
    @Body() request: CreateMovieReleaseRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot create movie releases');
    }
    return this.movieService.createMovieRelease(request);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async updateMovieRelease(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: CreateMovieReleaseRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot update movie releases');
    }
    return this.movieService.updateMovieRelease(id, request);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot delete movie releases');
    }
    await this.movieService.deleteMovieRelease(id);
    return null;
  }
}
