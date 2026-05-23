import { IsBoolean, IsOptional } from 'class-validator';

export class CleanupBackupDto {
  @IsBoolean()
  @IsOptional()
  dry_run?: boolean;
}
