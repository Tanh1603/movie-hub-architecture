/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AgeRatingEnum,
  CreateMovieReleaseRequest,
  CreateMovieRequest,
  CreateReviewRequest,
  LanguageOptionEnum,
  MovieDetailResponse,
  MovieQuery,
  MovieReleaseResponse,
  MovieSummary,
  ResourceNotFoundException,
  ReviewQuery,
  ReviewResponse,
  UpdateMovieReleaseRequest,
  UpdateMovieRequest,
  UpdateReviewRequest,
} from '@movie-hub/shared-types';
import { ServiceResult } from '@movie-hub/shared-types/common';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { MovieMapper } from './movie.mapper';

@Injectable()
export class MovieService {
  logger = new Logger(MovieService.name);

  constructor(private readonly prismaService: PrismaService) {}
  // CRUD Movie

  async getMovies(query: MovieQuery): Promise<ServiceResult<MovieSummary[]>> {
    const page = query && query.page ? Number(query.page) : 1;
    const limit = query && query.limit ? Number(query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : 0;
    const today = new Date();

    const where: any = {};

    if (query.status === 'now_showing') {
      where.movieReleases = {
        some: {
          startDate: { lte: today },
          OR: [{ endDate: { gte: today } }, { endDate: null }],
        },
      };
    } else if (query.status === 'upcoming') {
      where.movieReleases = {
        some: {
          startDate: { gt: today },
        },
      };
    }

    const movies = await this.prismaService.movie.findMany({
      where,
      select: {
        id: true,
        title: true,
        posterUrl: true,
        backdropUrl: true,
        runtime: true,
        ageRating: true,
        productionCountry: true,
        languageType: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
      },
      skip,
      take: limit,
    });

    let meta = null;
    if (query && limit) {
      const totalRecords = await this.prismaService.movie.count({ where });
      meta = {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        hasPrev: page > 1,
        hasNext: page * limit < totalRecords,
      };
    }

    const data = movies.map((movie) => {
      const { ageRating, languageType, ...rest } = movie;
      return {
        ...rest,
        ageRating: ageRating as unknown as AgeRatingEnum,
        languageType: languageType as unknown as LanguageOptionEnum,
        averageRating:
          movie.reviews.length > 0
            ? Number(
                (
                  movie.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  movie.reviews.length
                ).toFixed(1)
              )
            : 5,
        reviewCount: movie.reviews.length ?? 5,
      };
    });
    return {
      data,
      meta,
    };
  }

  async getMovieDetail(
    id: string
  ): Promise<ServiceResult<MovieDetailResponse>> {
    const movie = await this.prismaService.movie.findUnique({
      where: { id },
      include: {
        movieGenres: {
          include: {
            genre: true,
          },
        },
      },
    });

    if (!movie) {
      throw new ResourceNotFoundException('Movie', 'id', id);
    }

    const stats = await this.prismaService.review.aggregate({
      where: { movieId: movie.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      data: MovieMapper.toResponse({
        ...movie,
        averageRating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating ?? 0,
      }),
    };
  }

  async createMovie(
    createMovieRequest: CreateMovieRequest
  ): Promise<ServiceResult<MovieDetailResponse>> {
    const movie = await this.prismaService.$transaction(async (db) => {
      return await db.movie.create({
        data: MovieMapper.toMovie(createMovieRequest),
        include: {
          movieGenres: {
            include: {
              genre: true,
            },
          },
        },
      });
    });

    const stats = await this.prismaService.review.aggregate({
      where: { movieId: movie.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      data: MovieMapper.toResponse({
        ...movie,
        averageRating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating ?? 0,
      }),
      message: 'Create movie successfully!',
    };
  }

  async updateMovie(
    id: string,
    updateMovieRequest: UpdateMovieRequest
  ): Promise<ServiceResult<MovieDetailResponse>> {
    const existingMovie = await this.prismaService.movie.findUnique({
      where: { id },
    });

    if (!existingMovie) {
      throw new ResourceNotFoundException('Movie', 'id', id);
    }

    const updatedMovie = await this.prismaService.$transaction(async (db) => {
      if (updateMovieRequest.genreIds) {
        await db.movieGenre.deleteMany({
          where: {
            movieId: id,
          },
        });
      }

      return await db.movie.update({
        data: MovieMapper.toMovie(updateMovieRequest),
        where: {
          id: id,
        },
        include: {
          movieGenres: {
            include: {
              genre: true,
            },
          },
        },
      });
    });

    const stats = await this.prismaService.review.aggregate({
      where: { movieId: updatedMovie.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      data: MovieMapper.toResponse({
        ...updatedMovie,
        averageRating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating ?? 0,
      }),
      message: 'Update movie successfully!',
    };
  }

  async deleteMovie(id: string) {
    await this.prismaService.movie.delete({
      where: { id },
    });
    return {
      message: 'Delete movie successfully!',
    };
  }

  // CRUD Movie Release Date
  async getMovieRelease(movieId: string) {
    const movieRelease = await this.prismaService.movieRelease.findMany({
      where: { movieId },
      select: {
        id: true,
        movieId: true,
        startDate: true,
        endDate: true,
        note: true,
      },
    });

    return {
      data: movieRelease,
    };
  }

  async createMovieRelease(
    movieRelese: CreateMovieReleaseRequest
  ): Promise<ServiceResult<MovieReleaseResponse>> {
    const createdMovieRelease = await this.prismaService.$transaction(
      async (db) => {
        return await db.movieRelease.create({
          data: {
            movieId: movieRelese.movieId,
            startDate: movieRelese.startDate,
            endDate: movieRelese.endDate,
            note: movieRelese.note,
          },
          select: {
            id: true,
            movieId: true,
            startDate: true,
            endDate: true,
            note: true,
          },
        });
      }
    );

    return {
      data: {
        ...createdMovieRelease,
      },
      message: 'Create movie release successfully!',
    };
  }

  async updateMovieRelease(
    id: string,
    movieRelese: UpdateMovieReleaseRequest
  ): Promise<ServiceResult<MovieReleaseResponse>> {
    const updateMovieRelease = await this.prismaService.$transaction(
      async (db) => {
        return await db.movieRelease.update({
          where: { id },
          data: {
            ...(movieRelese.movieId !== undefined && {
              movieId: movieRelese.movieId,
            }),
            ...(movieRelese.startDate !== undefined && {
              startDate: movieRelese.startDate,
            }),
            ...(movieRelese.endDate !== undefined && {
              endDate: movieRelese.endDate,
            }),
            ...(movieRelese.note !== undefined && { note: movieRelese.note }),
          },
          select: {
            id: true,
            movieId: true,
            startDate: true,
            endDate: true,
            note: true,
          },
        });
      }
    );

    return {
      data: {
        ...updateMovieRelease,
      },
      message: 'Update movie release successfully!',
    };
  }

  async deleteMovieRelease(id: string) {
    await this.prismaService.movieRelease.delete({
      where: { id },
    });
    return {
      message: 'Delete movie release successfully!',
    };
  }

  // Function for internal microservice
  async getMovieByListId(movieIds: string[]) {
    const movies = await this.prismaService.movie.findMany({
      where: {
        id: {
          in: movieIds,
        },
      },
      include: {
        movieGenres: {
          include: {
            genre: true,
          },
        },
        movieReleases: true,
      },
    });
    // ⭐ Aggregate review theo movieId
    const reviewStats = await this.prismaService.review.groupBy({
      by: ['movieId'],
      where: {
        movieId: { in: movieIds },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Convert sang map để lookup nhanh O(1)
    const statsMap = new Map<
      string,
      { averageRating: number; reviewCount: number }
    >();

    reviewStats.forEach((s) => {
      statsMap.set(s.movieId, {
        averageRating: s._avg.rating ? Number(s._avg.rating.toFixed(1)) : 0,
        reviewCount: s._count.rating,
      });
    });

    return movies.map((movie) =>
      MovieMapper.toResponse({
        ...movie,
        averageRating: statsMap.get(movie.id)?.averageRating ?? 0,
        reviewCount: statsMap.get(movie.id)?.reviewCount ?? 0,
      })
    );
  }

  //reviews
  async getReviewsByMovie(
    query: ReviewQuery
  ): Promise<ServiceResult<ReviewResponse[]>> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      ...(query.movieId && { movieId: query.movieId }),
      ...(query.userId && { userId: query.userId }),
      ...(query.rating && { rating: Number(query.rating) }),
    };

    const orderBy: Prisma.ReviewOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder ?? 'desc' }
      : { createdAt: 'desc' };

    const [data, totalRecords] = await Promise.all([
      this.prismaService.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prismaService.review.count({ where }),
    ]);

    return {
      data: data as unknown as ReviewResponse[],
      message: 'Get reviews successfully',
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        hasPrev: page > 1,
        hasNext: page * limit < totalRecords,
      },
    };
  }

  async createReviewForMovie(
    reviewDto: CreateReviewRequest
  ): Promise<ServiceResult<ReviewResponse>> {
    const review = await this.prismaService.review.create({
      data: {
        movieId: reviewDto.movieId,
        userId: reviewDto.userId,
        rating: reviewDto.rating,
        content: reviewDto.content,
      },
    });

    return {
      data: review as unknown as ReviewResponse,
      message: `Create review for movieId ${reviewDto.movieId} by userId ${reviewDto.userId} successfully!`,
    };
  }

  async updateReview(
    id: string,
    reviewDto: UpdateReviewRequest
  ): Promise<ServiceResult<ReviewResponse>> {
    const review = await this.prismaService.review.update({
      where: { id },
      data: {
        ...reviewDto,
      },
    });

    return {
      data: review as unknown as ReviewResponse,
      message: `Update review for reviewId ${id} successfully!`,
    };
  }
}
