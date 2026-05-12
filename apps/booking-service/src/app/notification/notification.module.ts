import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationProviderAdapter } from './adapters/notification-provider.adapter';
import { SmtpNotificationProviderAdapter } from './adapters/smtp-notification-provider.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    NotificationService,
    {
      provide: NotificationProviderAdapter,
      useClass: SmtpNotificationProviderAdapter,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
