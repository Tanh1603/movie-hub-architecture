import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { StaffModule } from './staff/staff.module';
import { UserModule } from './user/user.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    StaffModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/user-service/.env',
      validationSchema: Joi.object({
        TCP_HOST: Joi.string().required(),
        TCP_PORT: Joi.number().required(),
        HTTP_PORT: Joi.number().optional(),
        CLERK_SECRET_KEY: Joi.string().required(),
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
