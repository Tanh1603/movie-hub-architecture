import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CinemaDetailResponse,
  CinemaStatusEnum,
  CreateCinemaRequest,
  MovieDetailResponse,
  MovieServiceMessage,
  MovieWithCinemaAndShowtimeResponse,
  MovieWithShowtimeResponse,
  ResourceNotFoundException,
  ResponseMessage,
  ShowtimesFilterDTO,
  UpdateCinemaRequest,
} from '@movie-hub/shared-types';
import { CinemaMapper } from './cinema.mapper';
import { PaginationQuery, ServiceResult } from '@movie-hub/shared-types/common';
import { ShowtimeStatus } from '../../../generated/prisma';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { ShowtimeMapper } from '../showtime/showtime.mapper';
import { PrismaClientKnownRequestError } from '../../../generated/prisma/runtime/library';

@Injectable()
export class CinemaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('MOVIE_SERVICE') private readonly movieClient: ClientProxy
  ) {}

  async createCinema(
    createCinemaDto: CreateCinemaRequest
  ): Promise<ServiceResult<CinemaDetailResponse>> {
    const cinema = await this.prisma.$transaction(async (db) => {
      return await db.cinemas.create({
        data: CinemaMapper.toCinema(createCinemaDto),
      });
    });

    return {
      data: CinemaMapper.toResponse(cinema),
      message: ResponseMessage.MSG_7,
    };
  }

  async updateCinema(
    id: string,
    updateCinemaRequest: UpdateCinemaRequest
  ): Promise<ServiceResult<CinemaDetailResponse>> {
    const existingCinema = await this.prisma.cinemas.findUnique({
      where: { id },
    });

    if (!existingCinema) {
      throw new ResourceNotFoundException('Cinema', 'id', id);
    }

    const updatedCinema = await this.prisma.$transaction(async (db) => {
      return await db.cinemas.update({
        data: CinemaMapper.toCinema(updateCinemaRequest),
        where: {
          id: id,
        },
      });
    });

    return {
      data: CinemaMapper.toResponse(updatedCinema),
      message: ResponseMessage.MSG_7,
    };
  }

  async deleteCinema(id: string): Promise<ServiceResult<void>> {
    try {
      const [hallCount, showtimeCount, bookingCount] = await Promise.all([
        this.prisma.halls.count({
          where: { cinema_id: id },
        }),
        this.prisma.showtimes.count({
          where: { cinema_id: id },
        }),
        this.prisma.seatReservations.count({
          where: {
            showtime: {
              cinema_id: id,
            },
          },
        }),
      ]);

      if (hallCount > 0 || showtimeCount > 0 || bookingCount > 0) {
        throw new RpcException('Cannot delete cinema with dependent data');
      }

      await this.prisma.cinemas.delete({
        where: { id },
      });

      return {
        data: undefined,
        message: ResponseMessage.MSG_7,
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new RpcException({
            summary: 'Delete cinema failed',
            statusCode: 404,
            code: 'CINEMA_NOT_FOUND',
            message: 'Cinema does not exist',
          });
        }
      }

      if (e instanceof RpcException) {
        throw new RpcException({
          summary: 'Delete cinema failed',
          statusCode: 400,
          code: 'CINEMA_IN_USE',
          message: e.message,
        });
      }

      throw new RpcException({
        summary: 'Delete cinema failed',
        statusCode: 500,
        code: 'DELETE_CINEMA_FAILED',
        message: 'Unexpected error occurred while deleting cinema',
      });
    }
  }

  async getAllCinemas(
    status: CinemaStatusEnum
  ): Promise<ServiceResult<CinemaDetailResponse[]>> {
    const cinemas = await this.prisma.cinemas.findMany({
      where: { status: status },
      orderBy: { name: 'asc' },
    });

    return {
      data: cinemas.map((cinema) => CinemaMapper.toResponse(cinema)),
      message: ResponseMessage.MSG_7,
    };
  }

  async getMoviesByCinema(
    cinemaId: string,
    query: PaginationQuery
  ): Promise<ServiceResult<MovieWithShowtimeResponse[]>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // 1. Lấy tất cả showtimes sắp tới của cinema
    const now = new Date();
    const showtimes = await this.prisma.showtimes.findMany({
      where: {
        cinema_id: cinemaId,
        start_time: { gte: now },
        status: ShowtimeStatus.SELLING,
      },
      orderBy: { start_time: 'asc' },
    });

    if (!showtimes.length) {
      return {
        meta: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
          hasPrev: false,
          hasNext: false,
        },
        data: [],
      };
    }

    // 2. Group showtimes theo movie_id
    const mapByMovie: Record<string, { movieId: string; showtimes: any[] }> =
      {};
    for (const st of showtimes) {
      if (!mapByMovie[st.movie_id]) {
        mapByMovie[st.movie_id] = { movieId: st.movie_id, showtimes: [] };
      }
      mapByMovie[st.movie_id].showtimes.push(st);
    }

    // 3. Danh sách movieId và pagination
    const allMovieIds = Object.keys(mapByMovie);
    const totalRecords = allMovieIds.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedMovieIds = allMovieIds.slice(skip, skip + limit);

    // 4. Lấy thông tin movie từ movie-service
    let movies: MovieDetailResponse[] = [];
    try {
      const rpcResponse = await lastValueFrom(
        this.movieClient
          .send<MovieDetailResponse[]>(
            MovieServiceMessage.MOVIE.GET_LIST_BY_ID,
            paginatedMovieIds
          )
          .pipe(timeout(5000))
      );
      movies = rpcResponse ?? [];
    } catch (err) {
      console.error('RPC getMoviesByCinema error:', err);
      throw new BadRequestException('Cannot fetch movies from movie service');
    }

    // 5. Ghép showtimes theo ngày gần nhất
    const response = movies.map((movie) => {
      const sts = mapByMovie[movie.id]?.showtimes ?? [];

      if (sts.length === 0) {
        return { ...movie, showtimes: [] };
      }

      // 5.1 Lấy danh sách unique ngày
      const dates = [
        ...new Set(sts.map((s) => s.start_time.toISOString().slice(0, 10))),
      ];

      const nearestDate = dates.sort()[0]; // YYYY-MM-DD sort

      // 5.2 Lọc showtimes thuộc ngày gần nhất
      const nearestShowtimes = sts.filter(
        (s) => s.start_time.toISOString().slice(0, 10) === nearestDate
      );

      return {
        ...movie,
        showtimes: ShowtimeMapper.toShowtimeSummaryList(nearestShowtimes),
      };
    });

    // 6. Trả về meta + data
    return {
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
      data: response,
      message: ResponseMessage.MSG_7,
    };
  }

  async getAllMoviesWithShowtimes(
    query: ShowtimesFilterDTO
  ): Promise<ServiceResult<MovieWithCinemaAndShowtimeResponse[]>> {
    const selectedDate = query.date ?? new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Lấy suất chiếu đang SELLING và đúng ngày
    const showtimes = await this.prisma.showtimes.findMany({
      where: {
        status: ShowtimeStatus.SELLING,
        start_time: {
          gte: new Date(selectedDate + 'T00:00:00Z'),
          lt: new Date(selectedDate + 'T23:59:59.999Z'),
        },
      },
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        start_time: 'asc',
      },
    });

    if (!showtimes.length)
      return { data: [], message: ResponseMessage.MSG_7 };

    // 2. Gom nhóm theo movie
    const mapByMovie = new Map<string, typeof showtimes>();

    for (const st of showtimes) {
      if (!mapByMovie.has(st.movie_id)) {
        mapByMovie.set(st.movie_id, []);
      }
      mapByMovie.get(st.movie_id).push(st);
    }

    const movieIds = [...mapByMovie.keys()];

    // 3. Gọi movie-service lấy thông tin movie
    let movies: MovieDetailResponse[] = [];
    try {
      movies = await lastValueFrom(
        this.movieClient
          .send(MovieServiceMessage.MOVIE.GET_LIST_BY_ID, movieIds)
          .pipe(timeout(5000))
      );
    } catch (err) {
      throw new BadRequestException('Cannot fetch movies from movie-service');
    }

    // 4. Merge + nhóm theo rạp
    const result = movies.map((movie) => {
      const sts = mapByMovie.get(movie.id) ?? [];

      const cinemaGroups: Record<string, any> = {};

      for (const st of sts) {
        const cid = st.cinema_id;

        if (!cinemaGroups[cid]) {
          cinemaGroups[cid] = {
            cinemaId: cid,
            name: st.cinema.name,
            address: st.cinema.address,
            showtimes: [],
          };
        }

        cinemaGroups[cid].showtimes.push(
          ShowtimeMapper.toShowtimeSummaryResponse(st)
        );
      }

      return {
        ...movie,
        cinemas: Object.values(cinemaGroups),
      };
    });

    return {
      data: result,
      message: ResponseMessage.MSG_7,
    };
  }
}
