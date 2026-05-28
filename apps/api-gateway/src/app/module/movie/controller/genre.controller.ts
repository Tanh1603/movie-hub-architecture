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
import { Permission } from '../../../common/decorator/permission.decorator';
import { SensitiveThrottle } from '../../../common/decorator/sensitive-throttle.decorator';

@Controller({
  version: '1',
  path: 'genres',
})
@UseInterceptors(new TransformInterceptor())
@SensitiveThrottle()
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'movie', action: 'create', scope: 'global' })
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
  @Permission({ resource: 'movie', action: 'update', scope: 'global' })
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
  @Permission({ resource: 'movie', action: 'delete', scope: 'global' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      throw new ForbiddenException('Managers cannot delete genres');
    }
    return this.genreService.remove(id);
  }
}



