import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { BackupService } from '../backup/backup.service';
import { SqliteService } from '../sqlite/sqlite.service';
import {
  DEFAULT_SCHEDULE_PRESET,
  PRESET_TO_CRON,
  SchedulePreset,
} from './schedule.types';

@Injectable()
export class BackupSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupSchedulerService.name);
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly backupService: BackupService,
    private readonly sqliteService: SqliteService
  ) {}

  async onModuleInit() {
    const state = await this.sqliteService.getScheduleState();
    await this.scheduleNextRun(state.preset_key as SchedulePreset);
  }

  onModuleDestroy() {
    this.clearTimer();
  }

  async getCurrentSchedule() {
    const state = await this.sqliteService.getScheduleState();
    return { preset: state.preset_key };
  }

  async updateSchedule(preset: SchedulePreset) {
    await this.sqliteService.setSchedulePreset(preset);
    await this.scheduleNextRun(preset);
    return { preset };
  }

  async runScheduledCycle() {
    const result = await this.backupService.runScheduledBackupCycle();
    if (!result.skipped) {
      await this.sqliteService.markScheduleRun(new Date().toISOString());
    }
    const latestState = await this.sqliteService.getScheduleState();
    await this.scheduleNextRun(latestState.preset_key as SchedulePreset);
    return result;
  }

  private async scheduleNextRun(preset: SchedulePreset) {
    this.clearTimer();
    const nextRunAt = this.getNextRunAt(preset);
    const delay = Math.max(1000, nextRunAt.getTime() - Date.now());

    this.logger.log(
      `Scheduled next backup run for ${nextRunAt.toISOString()} using ${
        PRESET_TO_CRON[preset] ?? PRESET_TO_CRON[DEFAULT_SCHEDULE_PRESET]
      }`
    );

    this.timer = setTimeout(() => {
      void this.runScheduledCycle().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Scheduled backup cycle failed: ${message}`);
      });
    }, delay);
  }

  private getNextRunAt(preset: SchedulePreset) {
    const now = new Date();
    const next = new Date(now.getTime());
    next.setUTCSeconds(0, 0);

    if (preset === SchedulePreset.EVERY_6_HOURS) {
      const currentHour = next.getUTCHours();
      const nextHour = Math.ceil((currentHour + 1) / 6) * 6;
      if (nextHour >= 24) {
        next.setUTCDate(next.getUTCDate() + 1);
        next.setUTCHours(0, 0, 0, 0);
      } else {
        next.setUTCHours(nextHour, 0, 0, 0);
      }
      return next;
    }

    next.setUTCHours(2, 0, 0, 0);
    if (preset === SchedulePreset.WEEKLY) {
      const day = next.getUTCDay();
      const daysUntilSunday = (7 - day) % 7;
      if (daysUntilSunday === 0 && next <= now) {
        next.setUTCDate(next.getUTCDate() + 7);
      } else if (daysUntilSunday > 0) {
        next.setUTCDate(next.getUTCDate() + daysUntilSunday);
      }
      return next;
    }

    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    return next;
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
