import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { PrismaService } from '../prisma.service';
import { PromotionModule } from '../promotion/promotion.module';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    forwardRef(() => PromotionModule),
    ClientsModule.register([
      {
        name: SERVICE_NAME.CINEMA,
        transport: Transport.TCP,
        options: {
          host: process.env.CINEMA_HOST || 'localhost',
          port: parseInt(process.env.CINEMA_PORT) || 3003,
        },
      },
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
  controllers: [RefundController],
  providers: [RefundService, PrismaService],
  exports: [RefundService],
})
export class RefundModule {}
