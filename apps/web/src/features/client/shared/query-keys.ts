export const clientQueryKeys = {
  bookings: {
    all: ['client-bookings'] as const,
    list: (status?: string, page?: number) =>
      [...clientQueryKeys.bookings.all, 'list', status, page] as const,
    detail: (bookingId: string) =>
      [...clientQueryKeys.bookings.all, 'detail', bookingId] as const,
    byShowtime: (showtimeId: string) =>
      [...clientQueryKeys.bookings.all, 'showtime', showtimeId] as const,
  },
  cinemas: {
    all: ['client-cinemas'] as const,
    nearby: (lat: number, lon: number, radius?: number, limit?: number) =>
      [...clientQueryKeys.cinemas.all, 'nearby', lat, lon, radius, limit] as const,
    filters: (params: Record<string, unknown>) =>
      [...clientQueryKeys.cinemas.all, 'filters', params] as const,
    search: (q: string, lon?: string, lat?: string) =>
      [...clientQueryKeys.cinemas.all, 'search', q, lon, lat] as const,
    detail: (cinemaId: string) =>
      [...clientQueryKeys.cinemas.all, 'detail', cinemaId] as const,
    moviesAtCinema: (cinemaId: string, params: Record<string, unknown>) =>
      [...clientQueryKeys.cinemas.all, 'movies-at-cinema', cinemaId, params] as const,
    moviesWithShowtimes: (params: Record<string, unknown>) =>
      [...clientQueryKeys.cinemas.all, 'movies-with-showtimes', params] as const,
    allList: () => [...clientQueryKeys.cinemas.all, 'all'] as const,
  },
  concessions: {
    all: ['client-concessions'] as const,
    list: (category?: string) =>
      [...clientQueryKeys.concessions.all, 'list', category] as const,
  },
  genres: {
    all: ['client-genres'] as const,
    list: () => [...clientQueryKeys.genres.all, 'list'] as const,
    detail: (id: string) => [...clientQueryKeys.genres.all, 'detail', id] as const,
  },
  movies: {
    all: ['client-movies'] as const,
    list: (params?: Record<string, unknown>) =>
      [...clientQueryKeys.movies.all, 'list', params] as const,
    detail: (id: string) => [...clientQueryKeys.movies.all, 'detail', id] as const,
  },
  promotions: {
    all: ['client-promotions'] as const,
    list: (type?: string) =>
      [...clientQueryKeys.promotions.all, 'list', type] as const,
    validate: () => [...clientQueryKeys.promotions.all, 'validate'] as const,
  },
  showtimes: {
    all: ['client-showtimes'] as const,
    seats: (showtimeId: string) =>
      [...clientQueryKeys.showtimes.all, 'seats', showtimeId] as const,
    ttl: (showtimeId: string) =>
      [...clientQueryKeys.showtimes.all, 'ttl', showtimeId] as const,
  },
  payments: {
    all: ['client-payments'] as const,
    create: () => [...clientQueryKeys.payments.all, 'create'] as const,
  },
};
