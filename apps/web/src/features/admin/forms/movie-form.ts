import type { CreateMovieRequest, Movie, UpdateMovieRequest } from '@/libs/api/types';

export type MovieFormValues = Partial<CreateMovieRequest> & {
  genreIds: string[];
};

export const createDefaultMovieForm = (): MovieFormValues => ({
  title: '',
  overview: '',
  originalTitle: '',
  posterUrl: '',
  trailerUrl: '',
  backdropUrl: '',
  runtime: 0,
  releaseDate: '',
  originalLanguage: 'en',
  spokenLanguages: ['en'],
  productionCountry: 'US',
  director: '',
  cast: [],
  genreIds: [],
});

export const mapMovieToForm = (movie: Movie): MovieFormValues => ({
  title: movie.title,
  overview: movie.overview ?? '',
  originalTitle: movie.originalTitle ?? '',
  posterUrl: movie.posterUrl,
  trailerUrl: movie.trailerUrl,
  backdropUrl: movie.backdropUrl ?? '',
  runtime: movie.runtime,
  releaseDate:
    typeof movie.releaseDate === 'string'
      ? movie.releaseDate.split('T')[0]
      : movie.releaseDate.toISOString().split('T')[0],
  ageRating: movie.ageRating,
  originalLanguage: movie.originalLanguage,
  spokenLanguages: movie.spokenLanguages ?? [],
  languageType: movie.languageType,
  productionCountry: movie.productionCountry ?? '',
  director: movie.director ?? '',
  cast: movie.cast ?? [],
  genreIds: movie.genreIds ?? (movie.genre ?? []).map((g) => g.id),
});

export const toCreateMovieRequest = (values: MovieFormValues): CreateMovieRequest => ({
  title: values.title ?? '',
  originalTitle: values.originalTitle ?? '',
  overview: values.overview ?? '',
  posterUrl: values.posterUrl ?? '',
  trailerUrl: values.trailerUrl ?? '',
  backdropUrl: values.backdropUrl ?? '',
  runtime: values.runtime ?? 0,
  releaseDate: values.releaseDate ?? '',
  ageRating: values.ageRating ?? 'P',
  originalLanguage: values.originalLanguage ?? 'en',
  spokenLanguages: values.spokenLanguages ?? ['en'],
  languageType: values.languageType ?? 'SUBTITLE',
  productionCountry: values.productionCountry ?? 'US',
  director: values.director ?? '',
  cast: values.cast ?? [],
  genreIds: values.genreIds ?? [],
});

export const toUpdateMovieRequest = (values: MovieFormValues): UpdateMovieRequest =>
  toCreateMovieRequest(values);

