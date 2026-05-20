import { AppRole, ReviewQuery } from '@movie-hub/shared-types';
import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { Permission } from '../../../common/decorator/permission.decorator';
import { Roles } from '../../../common/decorator/roles.decorator';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { RoleGuard } from '../../../common/guard/role.guard';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { ReviewService } from '../service/review.service';

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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.ADMIN)
  @Permission({ resource: 'review', action: 'delete', scope: 'global' })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
