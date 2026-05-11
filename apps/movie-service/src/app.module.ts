import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { GenreModule } from './module/genre/genre.module';
import { MovieModule } from './module/movie/movie.module';
import { ReviewModule } from './module/review/review.module';
import { PrismaModule } from './module/prisma/prisma.module';
import { HealthController } from './app/health/health.controller';

@Module({
  imports: [
    MovieModule,
    GenreModule,
    ReviewModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/movie-service/.env',
      validationSchema: Joi.object({
        TCP_PORT: Joi.string().required(),
        HTTP_PORT: Joi.number().optional(),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
