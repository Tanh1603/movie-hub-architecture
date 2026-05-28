import { IsNotEmpty, IsString } from 'class-validator';

export class TriggerBackupDto {
  @IsString()
  @IsNotEmpty()
  service!: string;
}
