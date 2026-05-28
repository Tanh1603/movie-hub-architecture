import { Body, Controller, Get, Post } from '@nestjs/common';
import { BackupSchedulerService } from './scheduler.service';
import { SchedulePresetDto } from './schedule.dto';

@Controller('api/schedule')
export class SchedulerController {
  constructor(
    private readonly backupSchedulerService: BackupSchedulerService
  ) {}

  @Get()
  async getSchedule() {
    return this.backupSchedulerService.getCurrentSchedule();
  }

  @Post()
  async updateSchedule(@Body() body: SchedulePresetDto) {
    return this.backupSchedulerService.updateSchedule(body.preset);
  }
}
