import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { NotificationModule } from '../notification/notification.module';
import { TicketModule } from '../ticket/ticket.module';
import { PrismaService } from '../prisma.service';
import { OutboxService } from './outbox.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationModule,
    TicketModule,
    ClientsModule.register([
      {
        name: SERVICE_NAME.USER,
        transport: Transport.TCP,
        options: {
          host: process.env.USER_HOST || 'localhost',
          port: parseInt(process.env.USER_PORT || '3001', 10),
        },
      },
    ]),
  ],
  providers: [OutboxService, PrismaService],
  exports: [OutboxService],
})
export class OutboxModule {}
