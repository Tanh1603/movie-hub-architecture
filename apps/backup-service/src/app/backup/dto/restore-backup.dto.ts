import { IsNotEmpty, IsString } from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  @IsNotEmpty()
  service!: string;

  @IsString()
  @IsNotEmpty()
  backup_id!: string;
}
