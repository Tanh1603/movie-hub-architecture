import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqliteService } from '../sqlite/sqlite.service';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

@Module({
  imports: [ConfigModule],
  controllers: [BackupController],
  providers: [BackupService, SqliteService],
  exports: [BackupService, SqliteService],
})
export class BackupModule {}
