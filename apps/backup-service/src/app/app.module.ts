import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { DashboardModule } from './dashboard/dashboard.module';
import { BackupModule } from './backup/backup.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/backup-service/.env',
      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().default(3006),
        DATABASE_URL: Joi.string().default('file:/data/backup-service.db'),
        BACKUP_SCRIPTS_PATH: Joi.string(),
        BACKUP_ROOT: Joi.string().default('/data/backups'),
        RESTORE_ROOT: Joi.string().default('/data/restores'),
        BACKUP_RETENTION_DAYS: Joi.number().default(30),
      }),
    }),
    BackupModule,
    DashboardModule,
    HealthModule,
    SchedulerModule,
  ],
})
export class AppModule {}
