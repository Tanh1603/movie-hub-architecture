import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma.service';
import { BookingRedisModule } from '../redis/redis.module';
import { NotificationModule } from '../notification/notification.module';
import { TicketModule } from '../ticket/ticket.module';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { VNPayPaymentAdapter } from './adapters/vnpay-payment.adapter';
import { ZaloPayPaymentAdapter } from './adapters/zalopay-payment.adapter';
import { PaymentAdapter } from './adapters/payment-adapter.interface';

export const PAYMENT_ADAPTERS = 'PAYMENT_ADAPTERS';

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
          port: parseInt(process.env.USER_PORT) || 3001,
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PrismaService,
    VNPayPaymentAdapter,
    ZaloPayPaymentAdapter,
    {
      provide: PAYMENT_ADAPTERS,
      useFactory: (
        vnpayAdapter: VNPayPaymentAdapter,
        zaloPayAdapter: ZaloPayPaymentAdapter
      ): PaymentAdapter[] => [vnpayAdapter, zaloPayAdapter],
      inject: [VNPayPaymentAdapter, ZaloPayPaymentAdapter],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
