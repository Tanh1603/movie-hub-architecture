import {
  ReviewQuery,
  ReviewResponse,
  ResponseMessage,
  ServiceResult,
} from '@movie-hub/shared-types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from './../../../generated/prisma';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ReviewQuery): Promise<ServiceResult<ReviewResponse[]>> {
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
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          movie: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: data.map((review) => ({
        id: review.id,
        movieId: review.movieId,
        userId: review.userId,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
        movie: review.movie
          ? { id: review.movie.id, title: review.movie.title }
          : undefined,
      })),
      message: ResponseMessage.MSG_7,
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

  async remove(id: string) {
    await this.prisma.review.delete({
      where: { id },
    });
    return {
      message: ResponseMessage.MSG_7,
    };
  }
}
