import { Body, Controller, Get, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '../service/config.service';
import { TransformInterceptor } from '../../../common/interceptor/transform.interceptor';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { Permission } from '../../../common/decorator/permission.decorator';
import {
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from '@movie-hub/shared-types';

@Controller({
  version: '1',
  path: 'config',
})
@UseInterceptors(new TransformInterceptor())
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.CONFIG,
    action: PermissionAction.READ,
    scope: PermissionScope.GLOBAL,
  })
  async findAll() {
    return this.configService.findAll();
  }

  @Put(':key')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.CONFIG,
    action: PermissionAction.UPDATE,
    scope: PermissionScope.GLOBAL,
  })
  async update(
    @Param('key') id: string,
    @Body() request: { key: string; value: unknown; description?: string }
  ) {
    return this.configService.update(request);
  }
}
