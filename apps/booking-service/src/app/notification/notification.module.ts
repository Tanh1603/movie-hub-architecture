import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationOutboxService } from './notification-outbox.service';
import { PiiCryptoService } from './pii-crypto.service';
import { PrismaService } from '../prisma.service';
import { SmtpService } from './smtp.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationService, NotificationOutboxService, PiiCryptoService, PrismaService, SmtpService],
  exports: [NotificationService, NotificationOutboxService, PiiCryptoService],
})
export class NotificationModule {}
