import { SERVICE_NAME } from '@movie-hub/shared-types';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MovieService } from './service/movie.service';
import { MovieController } from './controller/movie.controller';
import { GenreController } from './controller/genre.controller';
import { GenreService } from './service/genre.service';
import { MovieReleaseController } from './controller/movie-release.controller';
import { ReviewController } from './controller/review.controller';
import { ReviewService } from './service/review.service';

import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: SERVICE_NAME.Movie,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('MOVIE_HOST'),
            port: configService.get<number>('MOVIE_PORT'),
          },
        }),
      },
    ]),
    AuthModule,
  ],
  controllers: [
    MovieController,
    GenreController,
    MovieReleaseController,
    ReviewController,
  ],
  providers: [MovieService, GenreService, ReviewService],
  exports: [],
})
export class MovieModule {}
