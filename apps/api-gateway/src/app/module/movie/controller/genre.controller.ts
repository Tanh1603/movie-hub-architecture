import { GenreRequest } from '@movie-hub/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { GenreService } from '../service/genre.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';

@Controller({
  version: '1',
  path: 'genres',
})
@UseInterceptors(new TransformInterceptor())
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(@Req() req: any, @Body() request: GenreRequest) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot create genres');
    }
    return this.genreService.create(request);
  }

  @Get()
  async findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.genreService.findOne(id);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: GenreRequest
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot update genres');
    }
    return this.genreService.update(id, request);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot delete genres');
    }
    return this.genreService.remove(id);
  }
}
