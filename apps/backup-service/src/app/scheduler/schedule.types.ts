export enum SchedulePreset {
  EVERY_6_HOURS = 'EVERY_6_HOURS',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export const PRESET_TO_CRON: Record<SchedulePreset, string> = {
  [SchedulePreset.EVERY_6_HOURS]: '0 */6 * * *',
  [SchedulePreset.DAILY]: '0 2 * * *',
  [SchedulePreset.WEEKLY]: '0 2 * * 0',
};

export const DEFAULT_SCHEDULE_PRESET = SchedulePreset.DAILY;
