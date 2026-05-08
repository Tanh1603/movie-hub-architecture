import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PrismaService } from '../prisma.service';
import { ClerkSyncService } from './clerk-sync.service';

@Module({
  imports: [],
  controllers: [StaffController],
  providers: [StaffService, ClerkSyncService, PrismaService],
  exports: [],
})
export class StaffModule {}
