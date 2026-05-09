import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';
import { StaffModule } from './staff/staff.module';
import { UserModule } from './user/user.module';
import { ClerkModule } from './clerk.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ClerkModule,
    StaffModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/user-service/.env',
      validationSchema: Joi.object({
        TCP_HOST: Joi.string().required(),
        TCP_PORT: Joi.number().required(),
        CLERK_SECRET_KEY: Joi.string().required(),
        DEFAULT_ADMIN_EMAIL: Joi.string().email().optional(),
        DEFAULT_ADMIN_INITIAL_PASSWORD: Joi.string().min(8).optional(),
        DEFAULT_STAFF_INITIAL_PASSWORD: Joi.string().min(8).optional(),
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
