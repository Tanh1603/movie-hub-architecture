import { IsEnum } from 'class-validator';
import { SchedulePreset } from './schedule.types';

export class SchedulePresetDto {
  @IsEnum(SchedulePreset)
  preset!: SchedulePreset;
}
