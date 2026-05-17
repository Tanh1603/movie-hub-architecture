import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BackupService } from './backup.service';
import { CleanupBackupDto } from './cleanup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { TriggerBackupDto } from './dto/trigger-backup.dto';

@Controller('api/backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('trigger')
  async trigger(@Body() body: TriggerBackupDto) {
    return this.backupService.triggerManualBackup(body.service);
  }

  @Get('history')
  async history(@Query('limit') limit = '10') {
    return this.backupService.getBackupHistory(Number(limit) || 10);
  }

  @Post('restore')
  async restore(@Body() body: RestoreBackupDto) {
    return this.backupService.restoreBackup(body.service, body.backup_id);
  }

  @Post('cleanup')
  async cleanup(@Body() body: CleanupBackupDto) {
    return this.backupService.runCleanup(Boolean(body.dry_run));
  }
}
