import type { PaginationParams } from './api.type';
import type { Cinema } from './cinema.type';
import type { ShowtimeSummaryResponse } from './showtime.type';

export enum AgeRatingEnum {
  P = 'P', // Phù hợp mọi lứa tuổi
  k = 'K',
  T13 = 'T13', // Trên 13 tuổi
  T16 = 'T16', // Trên 16 tuổi
  T18 = 'T18', // Trên 18 tuổi
  C = 'C',
}

export enum LanguageOptionEnum {
  ORIGINAL = 'ORIGINAL', // Ngôn ngữ gốc
  SUBTITLE = 'SUBTITLE', // Phụ đề
  DUBBED = 'DUBBED', // Lồng tiếng / Thuyết minh
}

export type AgeRating = AgeRatingEnum | string;
export type LanguageType = LanguageOptionEnum | string;

export interface MovieSummary {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  runtime: number;
  ageRating: AgeRatingEnum;
  productionCountry: string;
  languageType: LanguageOptionEnum;
}
export interface GenreResponse {
  id: string;
  name: string;
}

export interface MovieDetailResponse extends MovieSummary {
  originalTitle: string;
  overview: string;
  trailerUrl: string;
  releaseDate: Date;
  originalLanguage: string;
  spokenLanguages: string[];
  director: string;
  cast: unknown;
  genre: GenreResponse[];
}

export interface MovieWithShowtimeResponse extends MovieDetailResponse {
  showtimes: ShowtimeSummaryResponse[];
}

export interface CinemaShowtimeGroup {
  cinemaId: string;
  name: string;
  address: string;
  showtimes: ShowtimeSummaryResponse[];
}

export interface MovieWithCinemaAndShowtimeResponse
  extends MovieDetailResponse {
  cinemas: CinemaShowtimeGroup[];
}

// ============================================================================
// ADMIN/API TYPES
// ============================================================================

export interface MovieCast {
  name: string;
  profileUrl?: string;
  character?: string;
}

export interface Genre {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGenreRequest {
  name: string;
}

export interface UpdateGenreRequest {
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  overview?: string;
  runtime: number;
  releaseDate: string | Date;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl: string;
  originalLanguage: string;
  spokenLanguages?: string[];
  languageType?: LanguageType;
  productionCountry?: string;
  ageRating: AgeRating;
  director?: string;
  cast?: MovieCast[];
  genreIds?: string[];
  genre?: Genre[];
  averageRating?: number;
  reviewCount?: number;
  status?: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateMovieRequest {
  title: string;
  originalTitle: string;
  overview: string;
  runtime: number;
  releaseDate: string | Date;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  originalLanguage: string;
  spokenLanguages: string[];
  languageType: LanguageType;
  productionCountry: string;
  ageRating: AgeRating;
  director: string;
  cast: MovieCast[];
  genreIds: string[];
}

export type CreateMovieDto = CreateMovieRequest;

export type UpdateMovieRequest = Partial<CreateMovieRequest>;

export interface MoviesListParams extends PaginationParams {
  search?: string;
  genreIds?: string[];
  status?: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
  releaseYear?: number;
  ageRating?: AgeRating;
}

export interface MovieRelease {
  id: string;
  movieId: string;
  movie?: Movie;
  cinemaId?: string;
  cinema?: Cinema;
  startDate: string | Date;
  endDate: string | Date;
  status?: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  note?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateMovieReleaseRequest {
  movieId: string;
  cinemaId?: string;
  startDate: string | Date;
  endDate?: string | Date;
  note?: string;
}

export type UpdateMovieReleaseRequest = Partial<CreateMovieReleaseRequest>;

export interface MovieReleasesListParams {
  cinemaId?: string;
  movieId?: string;
}
