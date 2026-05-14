import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { SmtpService } from './smtp.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationService, SmtpService],
  exports: [NotificationService],
})
export class NotificationModule {}
