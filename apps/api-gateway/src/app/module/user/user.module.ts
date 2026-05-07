import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StaffController } from './controller/staff.controller';
import { StaffService } from './service/staff.service';
import { ConfigController } from './controller/config.controller';
import { ConfigService as SettingService } from './service/config.service';
import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController, StaffController, ConfigController],
  providers: [UserService, StaffService, SettingService],
})
export class UserModule {}
