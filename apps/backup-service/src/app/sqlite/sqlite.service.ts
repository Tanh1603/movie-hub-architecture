import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dirname, isAbsolute, join } from 'path';
import { promises as fs } from 'fs';
import sqlite3 from 'sqlite3';

@Injectable()
export class SqliteService {
  private readonly dbPath: string;
  private db!: sqlite3.Database;
  private readonly logger = new Logger(SqliteService.name);
  private readonly initPromise: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    const pathSegment =
      databaseUrl?.replace(/^file:/, '') ?? '/data/backup-service.db';
    this.dbPath = isAbsolute(pathSegment)
      ? pathSegment
      : join('/data', pathSegment.replace(/^\.?\//, ''));
    this.initPromise = this.initializeDatabase();
  }

  private async initializeDatabase() {
    await fs.mkdir(dirname(this.dbPath), { recursive: true });
    await new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(
        this.dbPath,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (error) => {
          if (error) {
            this.logger.error('Failed to open SQLite database', error.message);
            reject(error);
            return;
          }

          resolve();
        }
      );
    });

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_seconds INTEGER,
        file_size_bytes INTEGER,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS backup_schedule_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        preset_key TEXT NOT NULL,
        last_run_at TEXT
      );
    `;

    await new Promise<void>((resolve, reject) => {
      this.db.exec(
        `${createTableSql}
         INSERT OR IGNORE INTO backup_schedule_state (id, preset_key, last_run_at) VALUES (1, 'DAILY', NULL);`,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  private async ensureReady() {
    return this.initPromise;
  }

  async recordBackup(entry: {
    id: string;
    service: string;
    type: 'MANUAL' | 'RESTORE' | 'SCHEDULED' | 'CLEANUP';
    status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
    startTime: string;
    endTime?: string;
    durationSeconds?: number;
    fileSizeBytes?: number;
    errorMessage?: string;
  }) {
    await this.ensureReady();
    const sql = `
      INSERT OR REPLACE INTO backups
      (id, service, type, status, start_time, end_time, duration_seconds, file_size_bytes, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise<void>((resolve, reject) => {
      this.db.run(
        sql,
        [
          entry.id,
          entry.service,
          entry.type,
          entry.status,
          entry.startTime,
          entry.endTime ?? null,
          entry.durationSeconds ?? null,
          entry.fileSizeBytes ?? null,
          entry.errorMessage ?? null,
        ],
        function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateBackupStatus(
    id: string,
    status: 'SUCCESS' | 'FAILED',
    updates: {
      endTime: string;
      durationSeconds: number;
      fileSizeBytes?: number;
      errorMessage?: string;
    }
  ) {
    await this.ensureReady();
    const sql = `
      UPDATE backups
      SET status = ?, end_time = ?, duration_seconds = ?, file_size_bytes = ?, error_message = ?
      WHERE id = ?
    `;

    return new Promise<void>((resolve, reject) => {
      this.db.run(
        sql,
        [
          status,
          updates.endTime,
          updates.durationSeconds,
          updates.fileSizeBytes ?? null,
          updates.errorMessage ?? null,
          id,
        ],
        function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async fetchHistory(limit: number) {
    await this.ensureReady();
    const sql = `
      SELECT id, service, type, status, start_time AS startTime, end_time AS endTime, duration_seconds AS durationSeconds, file_size_bytes AS fileSizeBytes, error_message AS errorMessage
      FROM backups
      ORDER BY start_time DESC
      LIMIT ?
    `;

    return new Promise<any[]>((resolve, reject) => {
      this.db.all(sql, [limit], (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getScheduleState() {
    await this.ensureReady();

    return new Promise<{ preset_key: string; last_run_at: string | null }>(
      (resolve, reject) => {
        this.db.get(
          `SELECT preset_key, last_run_at FROM backup_schedule_state WHERE id = 1`,
          (
            error,
            row: { preset_key: string; last_run_at: string | null } | undefined
          ) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(
              row ?? {
                preset_key: 'DAILY',
                last_run_at: null,
              }
            );
          }
        );
      }
    );
  }

  async setSchedulePreset(presetKey: string) {
    await this.ensureReady();
    return new Promise<void>((resolve, reject) => {
      this.db.run(
        `UPDATE backup_schedule_state SET preset_key = ? WHERE id = 1`,
        [presetKey],
        function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async markScheduleRun(lastRunAt: string) {
    await this.ensureReady();
    return new Promise<void>((resolve, reject) => {
      this.db.run(
        `UPDATE backup_schedule_state SET last_run_at = ? WHERE id = 1`,
        [lastRunAt],
        function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteHistoryBefore(cutoffIso: string) {
    await this.ensureReady();
    return new Promise<number>((resolve, reject) => {
      this.db.run(
        `DELETE FROM backups WHERE start_time < ?`,
        [cutoffIso],
        function (error) {
          if (error) {
            reject(error);
            return;
          }

          resolve(this.changes ?? 0);
        }
      );
    });
  }
}
