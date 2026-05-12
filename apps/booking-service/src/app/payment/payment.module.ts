import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma.service';
import { BookingRedisModule } from '../redis/redis.module';
import { NotificationModule } from '../notification/notification.module';
import { TicketModule } from '../ticket/ticket.module';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { PaymentProviderAdapter } from './adapters/payment-provider.adapter';
import { TcpPaymentProviderAdapter } from './adapters/tcp-payment-provider.adapter';

@Module({
  imports: [
    BookingRedisModule,
    NotificationModule,
    TicketModule,
    ClientsModule.register([
      {
        name: SERVICE_NAME.USER,
        transport: Transport.TCP,
        options: {
          host: process.env.USER_HOST || 'localhost',
          port: parseInt(process.env.USER_PORT as string) || 3001,
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PrismaService,
    {
      provide: PaymentProviderAdapter,
      useClass: TcpPaymentProviderAdapter,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
