import {
  AppRole,
  ConcessionCategory,
  CreateConcessionDto,
  UpdateConcessionDto
} from '@movie-hub/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '../../../common/decorator/permission.decorator';
import { Roles } from '../../../common/decorator/roles.decorator';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { RoleGuard } from '../../../common/guard/role.guard';
import { ConcessionService } from '../service/concession.service';

@Controller({
  version: '1',
  path: 'concessions',
})
export class ConcessionController {
  constructor(private readonly concessionService: ConcessionService) {}

  @Get()
  async findAll(
    @Query('cinemaId') cinemaId?: string,
    @Query('category') category?: ConcessionCategory,
    @Query('available') available?: string
  ) {
    return this.concessionService.findAll(
      cinemaId,
      category,
      available === 'true' ? true : available === 'false' ? false : undefined
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.concessionService.findOne(id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'concession', action: 'update', scope: 'cinema' })
  async create(@Body() createConcessionDto: CreateConcessionDto) {
    return this.concessionService.create(createConcessionDto);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'concession', action: 'update', scope: 'cinema' })
  async update(
    @Param('id') id: string,
    @Body() updateConcessionDto: UpdateConcessionDto
  ) {
    return this.concessionService.update(id, updateConcessionDto);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'concession', action: 'update', scope: 'cinema' })
  async delete(@Param('id') id: string) {
    return this.concessionService.delete(id);
  }

  @Patch(':id/inventory')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'concession', action: 'update', scope: 'cinema' })
  async updateInventory(
    @Param('id') id: string,
    @Body('quantity') quantity: number
  ) {
    return this.concessionService.updateInventory(id, quantity);
  }
}
