import {
  GenreRequest,
  GenreResponse,
  ResponseMessage,
} from '@movie-hub/shared-types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceResult } from '@movie-hub/shared-types/common';

@Injectable()
export class GenreService {
  constructor(private db: PrismaService) {}

  async createGenre(
    createGenreDto: GenreRequest
  ): Promise<ServiceResult<GenreResponse>> {
    return {
      data: await this.db.genre.create({
        data: { ...createGenreDto },
      }),
      message: ResponseMessage.MSG_7
    };
  }

  async getGenres(): Promise<ServiceResult<GenreResponse[]>> {
    const genres = await this.db.genre.findMany();
    return {
      data: genres,
    };
  }

  async findGenreById(id: string): Promise<ServiceResult<GenreResponse>> {
    return {
      data: await this.db.genre.findUnique({
        where: { id },
      }),
    };
  }

  async updateGenre(
    id: string,
    updateGenreDto: GenreRequest
  ): Promise<ServiceResult<GenreResponse>> {
    return {
      data: await this.db.genre.update({
        data: { ...updateGenreDto },
        where: { id },
      }),
      message: ResponseMessage.MSG_7,
    };
  }

  async deleteGenre(id: string) {
    await this.db.genre.delete({ where: { id } });
    return {
      message: ResponseMessage.MSG_7,
    };
  }
}
