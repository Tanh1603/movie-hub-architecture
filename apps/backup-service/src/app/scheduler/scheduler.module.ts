import { Module } from '@nestjs/common';
import { BackupModule } from '../backup/backup.module';
import { SchedulerController } from './scheduler.controller';
import { BackupSchedulerService } from './scheduler.service';

@Module({
  imports: [BackupModule],
  controllers: [SchedulerController],
  providers: [BackupSchedulerService],
})
export class SchedulerModule {}
