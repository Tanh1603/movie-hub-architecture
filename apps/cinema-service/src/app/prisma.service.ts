import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(
        `Prisma unavailable during bootstrap: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
