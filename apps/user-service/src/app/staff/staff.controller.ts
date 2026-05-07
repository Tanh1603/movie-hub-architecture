import { Controller } from '@nestjs/common';

import {
  CreateStaffRequest,
  StaffQuery,
  UpdateStaffRequest,
  UserMessage,
} from '@movie-hub/shared-types';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StaffService } from './staff.service';

@Controller('staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @MessagePattern(UserMessage.STAFF.CREATED)
  async create(@Payload() createStaffDto: CreateStaffRequest) {
    return this.staffService.create(createStaffDto);
  }

  @MessagePattern(UserMessage.STAFF.GET_LIST)
  async findAll(@Payload() query: StaffQuery) {
    return this.staffService.findAll(query);
  }

  @MessagePattern(UserMessage.STAFF.FIND_BY_EMAIL)
  async findByEmail(@Payload() email: string) {
    return this.staffService.findByEmail(email);
  }

  @MessagePattern(UserMessage.STAFF.GET_DETAIL)
  async findOne(@Payload() id: string) {
    return this.staffService.findOne(id);
  }

  @MessagePattern(UserMessage.STAFF.UPDATED)
  async update(
    @Payload() { id, data }: { id: string; data: UpdateStaffRequest }
  ) {
    return this.staffService.update(id, data);
  }

  @MessagePattern(UserMessage.STAFF.DELETED)
  async remove(@Payload() id: string) {
    return this.staffService.remove(id);
  }
}
