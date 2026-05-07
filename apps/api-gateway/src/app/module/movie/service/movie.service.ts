import {
  CreateMovieReleaseRequest,
  CreateMovieRequest,
  CreateReviewRequest,
  MovieQuery,
  MovieServiceMessage,
  ReviewQuery,
  SERVICE_NAME,
  UpdateMovieReleaseRequest,
  UpdateMovieRequest,
  UpdateReviewRequest,
} from '@movie-hub/shared-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class MovieService {
  logger = new Logger(MovieService.name);

  constructor(
    @Inject(SERVICE_NAME.Movie) private readonly client: ClientProxy
  ) {}

  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async getMovies(query: MovieQuery) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.GET_LIST, query)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getMovieDetail(id: string) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.GET_DETAIL, id)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createMovie(request: CreateMovieRequest) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.CREATED, request)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async updateMovie(id: string, updateMovieRequest: UpdateMovieRequest) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.UPDATED, {
          id,
          updateMovieRequest,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async deleteMovie(id: string) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.DELETED, id)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  // Movie Release Date
  async getMovieRelease(movieId: string) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.GET_LIST_RELEASE, movieId)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createMovieRelease(request: CreateMovieReleaseRequest) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE_RELEASE.CREATED, request)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async updateMovieRelease(
    id: string,
    updateMovieReleaseRequest: UpdateMovieReleaseRequest
  ) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE_RELEASE.UPDATED, {
          id,
          updateMovieReleaseRequest,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async deleteMovieRelease(id: string) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE_RELEASE.DELETED, id)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  // reviews

  async getReviews(query: ReviewQuery) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.GET_REVIEWS, query)
      );

      if (
        result?.data &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userIds = [
            ...new Set(result.data.map((r: any) => r.userId)),
          ] as string[];

          if (userIds.length > 0) {
            const users = await this.clerkClient.users.getUserList({
              userId: userIds,
              limit: userIds.length,
            });

            // Handle both PaginatedResponse and plain array if version differs, though v5 returns PaginatedResponse{ data: User[] } usually or Promise<User[]> depending on call.
            // Safe check:
            const userList = Array.isArray(users)
              ? users
              : (users as any).data || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userMap = new Map(userList.map((u: any) => [u.id, u]));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.data = result.data.map((r: any) => {
              const user = userMap.get(r.userId) as any;
              return {
                ...r,
                user: user
                  ? {
                      id: user.id,
                      fullName:
                        (user.firstName
                          ? `${user.firstName} ${user.lastName || ''}`
                          : user.fullName) || 'Người dùng',
                      imageUrl: user.imageUrl,
                    }
                  : null,
              };
            });
          }
        } catch (err) {
          this.logger.error(
            'Failed to enrich reviews with Clerk user data',
            err
          );
        }
      }

      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createReviews(request: CreateReviewRequest) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.CREATED_REVIEW, request)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async updateReview(id: string, request: UpdateReviewRequest) {
    try {
      return await firstValueFrom(
        this.client.send(MovieServiceMessage.MOVIE.UPDATED_REVIEW, {
          id,
          request,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
