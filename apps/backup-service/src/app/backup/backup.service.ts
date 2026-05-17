import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants as fsConstants, promises as fs } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
import { SqliteService } from '../sqlite/sqlite.service';

type ServiceKey = 'booking' | 'cinema' | 'movie' | 'user';

type BackupStatus = 'SUCCESS' | 'FAILED';

type RunResult = {
  success: boolean;
  error?: string;
};

const SUPPORTED_SERVICES: Record<string, ServiceKey> = {
  booking: 'booking',
  'booking-service': 'booking',
  cinema: 'cinema',
  'cinema-service': 'cinema',
  movie: 'movie',
  'movie-service': 'movie',
  user: 'user',
  'user-service': 'user',
};

const SERVICE_LABELS: Record<ServiceKey, string> = {
  booking: 'booking-service',
  cinema: 'cinema-service',
  movie: 'movie-service',
  user: 'user-service',
};

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private scriptsPath: string;
  private readonly backupRoot: string;
  private readonly restoreRoot: string;
  private readonly retentionDays: number;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly sqliteService: SqliteService
  ) {
    this.scriptsPath = '';
    this.backupRoot =
      this.configService.get<string>('BACKUP_ROOT') ?? '/data/backups';
    this.restoreRoot =
      this.configService.get<string>('RESTORE_ROOT') ?? '/data/restores';
    this.retentionDays =
      this.configService.get<number>('BACKUP_RETENTION_DAYS') ?? 30;
  }

  async onModuleInit() {
    this.scriptsPath = await this.validateRuntimeAssets();
  }

  async triggerManualBackup(service: string) {
    const serviceKey = this.resolveService(service);
    return this.runExclusive(async () => {
      const backupId = `backup-${serviceKey}-${Date.now()}`;
      const startTime = new Date().toISOString();
      await this.sqliteService.recordBackup({
        id: backupId,
        service: SERVICE_LABELS[serviceKey],
        type: 'MANUAL',
        status: 'IN_PROGRESS',
        startTime,
      });

      const scriptPath = join(
        this.scriptsPath,
        'postgresql',
        `backup-${serviceKey}.sh`
      );
      const runResult = await this.executeScript(scriptPath, {
        BACKUP_ROOT: this.backupRoot,
        RESTORE_ROOT: this.restoreRoot,
        RETENTION_DAYS: String(this.retentionDays),
        BACKUP_ID: backupId,
        DATABASE_URL: this.getServiceDatabaseUrl(serviceKey),
      });
      const endTime = new Date().toISOString();
      const durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
        )
      );
      const fileSizeBytes = await this.findBackupFileSize(backupId);
      const status: BackupStatus = runResult.success ? 'SUCCESS' : 'FAILED';

      await this.sqliteService.updateBackupStatus(backupId, status, {
        endTime,
        durationSeconds,
        fileSizeBytes,
        errorMessage: runResult.error,
      });

      return {
        backup_id: backupId,
        service: SERVICE_LABELS[serviceKey],
        status,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSizeBytes,
        error: runResult.error,
        started_at: startTime,
        finished_at: endTime,
      };
    });
  }

  async runScheduledBackupCycle() {
    if (this.isRunning) {
      return { skipped: true };
    }

    this.isRunning = true;
    try {
      const services: ServiceKey[] = ['booking', 'cinema', 'movie', 'user'];
      const startedAt = new Date().toISOString();
      const results = [] as Array<{
        backup_id: string;
        service: string;
        status: BackupStatus;
        duration_seconds: number;
        file_size_bytes: number;
        error?: string;
        started_at: string;
        finished_at: string;
      }>;

      for (const serviceKey of services) {
        const backupId = `backup-${serviceKey}-${Date.now()}`;
        const itemStart = new Date().toISOString();
        await this.sqliteService.recordBackup({
          id: backupId,
          service: SERVICE_LABELS[serviceKey],
          type: 'SCHEDULED',
          status: 'IN_PROGRESS',
          startTime: itemStart,
        });

        const runResult = await this.executeScript(
          join(this.scriptsPath, 'postgresql', `backup-${serviceKey}.sh`),
          {
            BACKUP_ROOT: this.backupRoot,
            RESTORE_ROOT: this.restoreRoot,
            RETENTION_DAYS: String(this.retentionDays),
            BACKUP_ID: backupId,
            DATABASE_URL: this.getServiceDatabaseUrl(serviceKey),
          }
        );
        const itemEnd = new Date().toISOString();
        const durationSeconds = Math.max(
          0,
          Math.round(
            (new Date(itemEnd).getTime() - new Date(itemStart).getTime()) / 1000
          )
        );
        const fileSizeBytes = await this.findBackupFileSize(backupId);
        const status: BackupStatus = runResult.success ? 'SUCCESS' : 'FAILED';

        await this.sqliteService.updateBackupStatus(backupId, status, {
          endTime: itemEnd,
          durationSeconds,
          fileSizeBytes,
          errorMessage: runResult.error,
        });

        results.push({
          backup_id: backupId,
          service: SERVICE_LABELS[serviceKey],
          status,
          duration_seconds: durationSeconds,
          file_size_bytes: fileSizeBytes,
          error: runResult.error,
          started_at: itemStart,
          finished_at: itemEnd,
        });
      }

      return {
        skipped: false,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        results,
      };
    } finally {
      this.isRunning = false;
    }
  }

  async restoreBackup(service: string, backupId: string) {
    const serviceKey = this.resolveService(service);
    return this.runExclusive(async () => {
      const restoreId = `restore-${serviceKey}-${Date.now()}`;
      const startTime = new Date().toISOString();
      await this.sqliteService.recordBackup({
        id: restoreId,
        service: SERVICE_LABELS[serviceKey],
        type: 'RESTORE',
        status: 'IN_PROGRESS',
        startTime,
      });

      const scriptPath = join(
        this.scriptsPath,
        'postgresql',
        `restore-${serviceKey}.sh`
      );
      const runResult = await this.executeScript(scriptPath, {
        BACKUP_ROOT: this.backupRoot,
        RESTORE_ROOT: this.restoreRoot,
        RETENTION_DAYS: String(this.retentionDays),
        BACKUP_ID: backupId,
        DATABASE_URL: this.getServiceDatabaseUrl(serviceKey),
      });
      const endTime = new Date().toISOString();
      const durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
        )
      );
      const status: BackupStatus = runResult.success ? 'SUCCESS' : 'FAILED';

      await this.sqliteService.updateBackupStatus(restoreId, status, {
        endTime,
        durationSeconds,
        errorMessage: runResult.error,
      });

      return {
        restore_id: restoreId,
        service: SERVICE_LABELS[serviceKey],
        backup_id: backupId,
        status,
        duration_seconds: durationSeconds,
        error: runResult.error,
        started_at: startTime,
        finished_at: endTime,
      };
    });
  }

  async runCleanup(dryRun: boolean) {
    if (dryRun) {
      return {
        dry_run: true,
        ...((await this.previewCleanup()) ?? {
          deleted_count: 0,
          deleted_files: [],
        }),
      };
    }

    return this.runExclusive(async () => {
      const startTime = new Date().toISOString();
      const preview = await this.previewCleanup();
      const cleanupScript = join(
        this.scriptsPath,
        'cleanup',
        'backup-retention-cleanup.sh'
      );
      const runResult = await this.executeScript(cleanupScript, {
        BACKUP_ROOT: this.backupRoot,
        RETENTION_DAYS: String(this.retentionDays),
      });
      const endTime = new Date().toISOString();
      const durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
        )
      );

      if (runResult.success) {
        const cutoffIso = new Date(
          Date.now() - this.retentionDays * 24 * 60 * 60 * 1000
        ).toISOString();
        await this.sqliteService.deleteHistoryBefore(cutoffIso);
      }

      return {
        dry_run: false,
        status: runResult.success ? 'SUCCESS' : 'FAILED',
        deleted_count: preview.deleted_count,
        deleted_files: preview.deleted_files,
        duration_seconds: durationSeconds,
        error: runResult.error,
        started_at: startTime,
        finished_at: endTime,
      };
    });
  }

  async getBackupHistory(limit: number) {
    return this.sqliteService.fetchHistory(limit);
  }

  private resolveService(service: string): ServiceKey {
    const resolved = SUPPORTED_SERVICES[service.toLowerCase().trim()];
    if (!resolved) {
      throw new BadRequestException(
        'Unsupported service. Use booking-service, cinema-service, movie-service, or user-service.'
      );
    }

    return resolved;
  }

  private async runExclusive<T>(operation: () => Promise<T>) {
    if (this.isRunning) {
      throw new ConflictException('A backup is already running');
    }

    this.isRunning = true;
    try {
      return await operation();
    } finally {
      this.isRunning = false;
    }
  }

  private executeScript(scriptPath: string, env?: NodeJS.ProcessEnv) {
    return new Promise<RunResult>((resolve) => {
      this.logger.log(`Executing backup script: ${scriptPath}`);
      const child = spawn(scriptPath, {
        shell: true,
        stdio: 'inherit',
        env: {
          ...process.env,
          ...env,
        },
      });

      child.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `Script exited with code ${code}` });
        }
      });
    });
  }

  private async previewCleanup() {
    const cutoffMs = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    const deletedFiles: string[] = [];
    const backupDirectory = join(this.backupRoot, 'postgresql');

    const visit = async (directory: string) => {
      let entries: Array<import('fs').Dirent> = [];
      try {
        entries = await fs.readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(fullPath);
          continue;
        }

        if (!entry.isFile() || !entry.name.endsWith('.dump')) {
          continue;
        }

        const stats = await fs.stat(fullPath);
        if (stats.mtimeMs < cutoffMs) {
          deletedFiles.push(fullPath);
        }
      }
    };

    await visit(backupDirectory);

    return {
      deleted_count: deletedFiles.length,
      deleted_files: deletedFiles,
    };
  }

  private async findBackupFileSize(backupId: string): Promise<number> {
    try {
      const backupFile = join(
        this.backupRoot,
        'postgresql',
        `${backupId}.dump`
      );
      const stats = await fs.stat(backupFile);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private getServiceDatabaseUrl(serviceKey: ServiceKey) {
    const envName = `${serviceKey.toUpperCase()}_SERVICE_DATABASE_URL`;
    const databaseUrl = this.configService.get<string>(envName);

    if (!databaseUrl) {
      throw new BadRequestException(
        `Missing required environment variable: ${envName}`
      );
    }

    return databaseUrl;
  }

  private async validateRuntimeAssets() {
    const candidateRoots = this.getCandidateScriptsRoots();
    const requiredPaths = [
      ['postgresql'],
      ['postgresql', 'postgresql-common.sh'],
      ['postgresql', 'backup-booking.sh'],
      ['postgresql', 'backup-cinema.sh'],
      ['postgresql', 'backup-movie.sh'],
      ['postgresql', 'backup-user.sh'],
      ['postgresql', 'restore-booking.sh'],
      ['postgresql', 'restore-cinema.sh'],
      ['postgresql', 'restore-movie.sh'],
      ['postgresql', 'restore-user.sh'],
      ['cleanup', 'backup-retention-cleanup.sh'],
    ];

    for (const scriptsRoot of candidateRoots) {
      let allAssetsPresent = true;

      for (const assetSegments of requiredPaths) {
        const assetPath = join(scriptsRoot, ...assetSegments);

        try {
          const stats = await fs.stat(assetPath);
          if (stats.isDirectory()) {
            continue;
          }

          await fs.access(assetPath, fsConstants.R_OK | fsConstants.X_OK);
        } catch {
          allAssetsPresent = false;
          break;
        }
      }

      if (allAssetsPresent) {
        return scriptsRoot;
      }
    }

    const message = `Missing required scripts in any known runtime path: ${candidateRoots.join(
      ', '
    )}`;
    this.logger.error(message);
    throw new Error(message);
  }

  private getCandidateScriptsRoots() {
    const configuredPath = this.configService.get<string>(
      'BACKUP_SCRIPTS_PATH'
    );
    const candidates = [
      configuredPath,
      join(process.cwd(), 'apps/backup-service/scripts'),
      join(process.cwd(), 'dist/apps/backup-service/scripts'),
      join(process.cwd(), 'scripts'),
      '/app/scripts',
    ].filter((candidate): candidate is string => Boolean(candidate));

    return [...new Set(candidates)];
  }
}
