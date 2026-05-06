// src/app/(admin)/movies/page.tsx
'use client';


import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Plus,
  Search,
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Film as FilmIcon,
  Calendar,
  X,
} from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Card, CardContent } from '@movie-hub/shacdn-ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movie-hub/shacdn-ui/dialog';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Textarea } from '@movie-hub/shacdn-ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
// Badge removed (not used in overlay) — kept import commented for future use
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@movie-hub/shacdn-ui/dropdown-menu';
import {
  moviesApi,
  movieReleasesApi,
} from '@/libs/api';
import { useGenres } from '@/libs/api';
import {
  useAdminCreateMovie,
  useAdminDeleteMovie,
  useAdminMovies,
  useAdminUpdateMovie,
} from '@/features/admin/movies';
import type {
  Movie,
  CreateMovieRequest,
  AgeRating,
  LanguageType,
  MovieCast,
} from '@/libs/api/types';
import {
  AgeRatingEnum,
  LanguageOptionEnum,
} from '@movie-hub/shared-types/movie/enum';
import Image from 'next/image';
import MovieReleaseDialog from '../_components/forms/MovieReleaseDialog';

// Type for enriched movie with status
interface EnrichedMovie extends Movie {
  displayOverview?: string;
  displayDirector?: string;
  calculatedStatus?: string;
}

export default function MoviesPage() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string;
  const isManager = userRole === 'CINEMA_MANAGER';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [genreSearch, setGenreSearch] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [validationErrorOpen, setValidationErrorOpen] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [addReleaseDialogOpen, setAddReleaseDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedMovieIdForRelease, setSelectedMovieIdForRelease] =
    useState<string>('');
  const [enrichedMovies, setEnrichedMovies] = useState<
    Map<string, EnrichedMovie>
  >(new Map());
  const [formData, setFormData] = useState<Partial<CreateMovieRequest>>({
    title: '',
    overview: '',
    originalTitle: '',
    posterUrl: '',
    trailerUrl: '',
    backdropUrl: '',
    runtime: 0,
    releaseDate: '',
    ageRating: AgeRatingEnum.P as AgeRating,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    languageType: LanguageOptionEnum.SUBTITLE as LanguageType,
    productionCountry: 'US',
    director: '',
    cast: [] as MovieCast[],
    genreIds: [] as string[],
  });

  // API hooks
  const { data: moviesData = [] } = useAdminMovies();
  const movies = useMemo(() => moviesData || [], [moviesData]);
  const { data: genresData = [] } = useGenres();
  const genres = useMemo(() => genresData || [], [genresData]);
  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((g: any) =>
      String(g.name || '')
        .toLowerCase()
        .includes(q)
    );
  }, [genres, genreSearch]);
  const createMovie = useAdminCreateMovie();
  const updateMovie = useAdminUpdateMovie();
  const deleteMovie = useAdminDeleteMovie();

  const loading =
    createMovie.isPending || updateMovie.isPending || deleteMovie.isPending;

  const ageRatingOptions: AgeRating[] = [
    AgeRatingEnum.P,
    AgeRatingEnum.K,
    AgeRatingEnum.T13,
    AgeRatingEnum.T16,
    AgeRatingEnum.T18,
    AgeRatingEnum.C,
  ];
  const languageTypeOptions: LanguageType[] = [
    LanguageOptionEnum.ORIGINAL,
    LanguageOptionEnum.SUBTITLE,
    LanguageOptionEnum.DUBBED,
  ];

  // Function to calculate movie status based on releases
  const calculateMovieStatus = (
    releaseDate?: string | Date | null,
    releases?: Array<{ startDate: string; endDate?: string | null }>
  ): string => {
    // Priority 1: Use movieRelease dates if available
    if (releases && releases.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const release of releases) {
        const startDate = new Date(release.startDate);
        const endDate = release.endDate ? new Date(release.endDate) : null;

        startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(0, 0, 0, 0);

        // If movie is currently showing in any cinema
        if (startDate <= today && (!endDate || endDate >= today)) {
          return 'NOW_SHOWING';
        }
      }

      // If no active releases, check if any are upcoming
      for (const release of releases) {
        const startDate = new Date(release.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (startDate > today) {
          return 'COMING_SOON';
        }
      }
      return 'ENDED';
    }

    // Priority 2: Use releaseDate if no releases
    if (releaseDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const release = new Date(releaseDate);
      release.setHours(0, 0, 0, 0);

      if (release > today) {
        return 'COMING_SOON';
      } else {
        return 'NOW_SHOWING';
      }
    }

    return 'COMING_SOON';
  };

  // Fetch full movie details and releases to enrich the list
  useEffect(() => {
    const enrichMoviesData = async () => {
      const enrichedMap = new Map<string, EnrichedMovie>();

      for (const movie of movies) {
        try {
          // Fetch full movie details to get overview and director
          const detailResponse = await moviesApi.getById(movie.id);
          const fullMovie =
            typeof detailResponse === 'object' && 'data' in detailResponse
              ? (detailResponse as { data: Movie }).data
              : (detailResponse as Movie);

          // Fetch movie releases for status calculation
          let releases: Array<{ startDate: string; endDate?: string | null }> =
            [];
          try {
            const releasesResponse = await movieReleasesApi.getAll({
              movieId: movie.id,
            });
            releases = Array.isArray(releasesResponse)
              ? (releasesResponse as Array<{
                  startDate: string;
                  endDate?: string | null;
                }>)
              : (
                  releasesResponse as {
                    data?: Array<{
                      startDate: string;
                      endDate?: string | null;
                    }>;
                  }
                )?.data ?? [];
          } catch {
            // If releases fetch fails, continue with empty array
            releases = [];
          }

          const enrichedMovie: EnrichedMovie = {
            ...movie,
            displayOverview:
              fullMovie.overview && fullMovie.overview.trim()
                ? fullMovie.overview
                : undefined,
            displayDirector:
              fullMovie.director && fullMovie.director.trim()
                ? fullMovie.director
                : undefined,
            calculatedStatus: calculateMovieStatus(movie.releaseDate, releases),
            // include full detail fields so overlay can read cast/genre/etc
            cast: fullMovie.cast || movie.cast || [],
            genre: fullMovie.genre || movie.genre || [],
            spokenLanguages:
              fullMovie.spokenLanguages || movie.spokenLanguages || [],
            productionCountry:
              fullMovie.productionCountry || movie.productionCountry,
          };

          // update progressively so UI shows enriched data per movie as soon as available
          setEnrichedMovies((prev) => {
            const m = new Map(prev);
            m.set(movie.id, enrichedMovie);
            return m;
          });
          enrichedMap.set(movie.id, enrichedMovie);
        } catch {
          // If detail fetch fails, use list data with calculated status based on releaseDate only
          const enrichedMovie: EnrichedMovie = {
            ...movie,
            displayOverview:
              movie.overview && movie.overview.trim()
                ? movie.overview
                : undefined,
            displayDirector:
              movie.director && movie.director.trim()
                ? movie.director
                : undefined,
            calculatedStatus: calculateMovieStatus(movie.releaseDate),
          };
          setEnrichedMovies((prev) => {
            const m = new Map(prev);
            m.set(movie.id, enrichedMovie);
            return m;
          });
          enrichedMap.set(movie.id, enrichedMovie);
        }
      }

      // final snapshot (no-op if same)
      setEnrichedMovies(enrichedMap);
    };

    if (movies.length > 0) {
      enrichMoviesData();
    }
  }, [movies]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.title?.trim()) {
      setValidationErrorMessage('Tiêu đề là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.overview?.trim()) {
      setValidationErrorMessage('Tóm tắt là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.posterUrl?.trim()) {
      setValidationErrorMessage('URL Poster là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.releaseDate) {
      setValidationErrorMessage('Ngày phát hành là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.runtime || formData.runtime <= 0) {
      setValidationErrorMessage('Thời lượng phải lớn hơn 0');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.originalLanguage?.trim()) {
      setValidationErrorMessage('Ngôn ngữ gốc là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.director?.trim()) {
      setValidationErrorMessage('Đạo diễn là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }
    if (!formData.spokenLanguages || formData.spokenLanguages.length === 0) {
      setValidationErrorMessage('Ít nhất một ngôn ngữ nói là bắt buộc');
      setValidationErrorOpen(true);
      return;
    }

    try {
      const apiData = {
        ...formData,
        cast: formData.cast || [],
      };
      if (selectedMovie) {
        await updateMovie.mutateAsync({ id: selectedMovie.id, data: apiData });
      } else {
        await createMovie.mutateAsync(apiData as CreateMovieRequest);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error toast already shown by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (!selectedMovie) return;
    try {
      await deleteMovie.mutateAsync(selectedMovie.id);
      setDeleteDialogOpen(false);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      overview: '',
      originalTitle: '',
      posterUrl: '',
      trailerUrl: '',
      backdropUrl: '',
      runtime: 0,
      releaseDate: '',
      ageRating: AgeRatingEnum.P,
      originalLanguage: 'en',
      spokenLanguages: ['en'],
      languageType: LanguageOptionEnum.SUBTITLE,
      productionCountry: 'US',
      director: '',
      cast: [],
      genreIds: [],
    });
    setSelectedMovie(null);
  };

  const openEditDialog = async (movie: Movie) => {
    setSelectedMovie(movie);
    try {
      // Fetch full movie detail to ensure all fields are populated
      const fullMovieDetail = await moviesApi.getById(movie.id);

      // Parse releaseDate safely - handle ISO string, Date object, or malformed input
      let releaseDateStr = '';
      if (typeof fullMovieDetail.releaseDate === 'string') {
        // If already a string, check if it's YYYY-MM-DD format or ISO datetime
        if (fullMovieDetail.releaseDate.includes('T')) {
          releaseDateStr = fullMovieDetail.releaseDate.split('T')[0];
        } else {
          releaseDateStr = fullMovieDetail.releaseDate;
        }
      } else if (fullMovieDetail.releaseDate instanceof Date) {
        releaseDateStr = fullMovieDetail.releaseDate
          .toISOString()
          .split('T')[0];
      } else {
        try {
          // Last resort: try to parse as Date
          const date = new Date(fullMovieDetail.releaseDate);
          if (!isNaN(date.getTime())) {
            releaseDateStr = date.toISOString().split('T')[0];
          }
        } catch {
          releaseDateStr = '';
        }
      }

      setFormData({
        title: fullMovieDetail.title,
        overview: fullMovieDetail.overview,
        originalTitle: fullMovieDetail.originalTitle || '',
        posterUrl: fullMovieDetail.posterUrl,
        trailerUrl: fullMovieDetail.trailerUrl || '',
        backdropUrl: fullMovieDetail.backdropUrl || '',
        runtime: fullMovieDetail.runtime,
        releaseDate: releaseDateStr,
        ageRating: fullMovieDetail.ageRating,
        originalLanguage: fullMovieDetail.originalLanguage,
        spokenLanguages: fullMovieDetail.spokenLanguages || [],
        languageType: fullMovieDetail.languageType,
        productionCountry: fullMovieDetail.productionCountry,
        director: fullMovieDetail.director || '',
        cast: fullMovieDetail.cast || [],
        genreIds: (() => {
          const raw =
            (fullMovieDetail as any).genre ??
            (fullMovieDetail as any).genres ??
            (fullMovieDetail as any).genreIds ??
            [];
          if (Array.isArray(raw)) {
            if (raw.length > 0 && typeof raw[0] === 'object')
              return raw.map((g: any) => String(g.id));
            return raw.map((v: any) => String(v));
          }
          if (raw && typeof raw === 'object' && 'id' in raw)
            return [String(raw.id)];
          if (raw != null) return [String(raw)];
          return [];
        })(),
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch movie detail:', error);
      // Fallback to summary data if detail fetch fails
      setFormData({
        title: movie.title,
        overview: movie.overview || '',
        originalTitle: movie.originalTitle || '',
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl || '',
        backdropUrl: movie.backdropUrl || '',
        runtime: movie.runtime,
        releaseDate: '',
        ageRating: movie.ageRating,
        originalLanguage: movie.originalLanguage,
        spokenLanguages: movie.spokenLanguages || [],
        languageType: movie.languageType,
        productionCountry: movie.productionCountry,
        director: movie.director || '',
        cast: movie.cast || [],
        genreIds: (() => {
          const raw =
            (movie as any).genre ??
            (movie as any).genres ??
            (movie as any).genreIds ??
            [];
          if (Array.isArray(raw)) {
            if (raw.length > 0 && typeof raw[0] === 'object')
              return raw.map((g: any) => String(g.id));
            return raw.map((v: any) => String(v));
          }
          if (raw && typeof raw === 'object' && 'id' in raw)
            return [String(raw.id)];
          if (raw != null) return [String(raw)];
          return [];
        })(),
      });
      setDialogOpen(true);
    }
  };

  // Utility: normalize possible singular or array API shapes into arrays
  function ensureArray<T>(val?: T | T[] | null): T[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  // Normalize movie -> genre ids (handles `genre`, `genres`, `genreIds`, singular/object shapes)
  function getMovieGenreIds(movie: Movie): string[] {
    const ids: string[] = [];

    // movie.genre may be array, single object, or single id/string
    const rawGenre = (movie as any).genre ?? (movie as any).genres ?? null;
    if (rawGenre) {
      if (Array.isArray(rawGenre)) {
        rawGenre.forEach((g: any) => {
          if (g && typeof g === 'object' && 'id' in g) ids.push(String(g.id));
          else ids.push(String(g));
        });
      } else if (rawGenre && typeof rawGenre === 'object' && 'id' in rawGenre) {
        ids.push(String(rawGenre.id));
      } else if (rawGenre != null) {
        ids.push(String(rawGenre));
      }
    }

    // movie.genreIds explicit array
    if (Array.isArray((movie as any).genreIds)) {
      ((movie as any).genreIds as any[]).forEach((gid) =>
        ids.push(String(gid))
      );
    }

    // dedupe
    return Array.from(new Set(ids.filter(Boolean)));
  }

  // Get display names for a movie's genres; prefer included objects, fallback to lookup by id
  function getMovieGenreNames(movie: Movie): string[] {
    const names: string[] = [];
    const rawGenre = (movie as any).genre ?? (movie as any).genres ?? null;

    if (rawGenre) {
      if (Array.isArray(rawGenre)) {
        rawGenre.forEach((g: any) => {
          if (g && typeof g === 'object' && 'name' in g)
            names.push(String(g.name));
          else if (g != null) names.push(String(g));
        });
      } else if (
        rawGenre &&
        typeof rawGenre === 'object' &&
        'name' in rawGenre
      ) {
        names.push(String(rawGenre.name));
      } else if (rawGenre != null) {
        names.push(String(rawGenre));
      }
    }

    if (Array.isArray((movie as any).genreIds)) {
      ((movie as any).genreIds as string[]).forEach((gid) => {
        // try to resolve name from loaded genres list
        const g = genres.find((x: any) => String(x.id) === String(gid));
        if (g && g.name) names.push(g.name);
        else names.push(String(gid));
      });
    }

    return Array.from(new Set(names.filter(Boolean)));
  }

  // Filter by iterating original movies and preferring enriched data where present,
  // but always falling back to the original movie for missing fields (e.g., releaseDate)
  const filteredSources = movies
    .filter((movie) => {
      const enriched = enrichedMovies.get(movie.id) as
        | EnrichedMovie
        | undefined;
      const source: Movie | EnrichedMovie = enriched || movie;

      // Search filter (title should come from original movie to match listing behavior)
      if (
        searchQuery &&
        !String(movie.title || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Genre filter (must have ALL selected genres) - use enriched if available
      if (selectedGenreIds.length > 0) {
        const movieGenreIds = getMovieGenreIds(source as Movie);
        const hasAllGenres = selectedGenreIds.every((genreId) =>
          movieGenreIds.includes(genreId)
        );
        if (!hasAllGenres) return false;
      }

      // Release year filter removed — filtering now relies on genres, status and rating only

      // Rating filter - prefer enriched then fallback
      const ratingToCheck = (source as any).ageRating ?? movie.ageRating;
      if (selectedRating !== 'all' && ratingToCheck !== selectedRating) {
        return false;
      }

      // Status filter - use enriched calculatedStatus if available, else fallback to movie.status
      if (selectedStatus !== 'all') {
        const statusToCheck =
          (enriched && enriched.calculatedStatus) ||
          (movie as any).status ||
          undefined;
        if (statusToCheck !== selectedStatus) return false;
      }

      return true;
    })
    .map((m) => enrichedMovies.get(m.id) || m) as EnrichedMovie[];

  const displayedMovies = useMemo(() => filteredSources, [filteredSources]);

  const releaseDateValue = (() => {
    const rd = (formData as any).releaseDate;
    if (!rd) return '';
    if (typeof rd === 'string') return rd.includes('T') ? rd.split('T')[0] : rd;
    if (rd instanceof Date) return rd.toISOString().split('T')[0];
    try {
      const d = new Date(rd as any);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) {
      /* ignore */
    }
    return '';
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phim</h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục phim của bạn</p>
        </div>
        {!isManager && (
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm phim
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Modern Filter Container with Gradient */}
          <div className="p-5 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-purple-600" />
              <Input
                placeholder="🔍 Tìm kiếm phim theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white border border-purple-200 rounded-lg shadow-sm h-11 focus:border-purple-400 focus:ring-purple-200 font-medium"
              />
            </div>

            {/* Advanced filters row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status filter */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  📊 Trạng Thái
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="h-10 bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-400 font-medium">
                    <SelectValue placeholder="Tất Cả Trạng Thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                    <SelectItem value="NOW_SHOWING">Đang Chiếu</SelectItem>
                    <SelectItem value="COMING_SOON">Sắp Tới</SelectItem>
                    <SelectItem value="ENDED">Đã Kết Thúc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age rating filter */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  🎫 Xếp Hạng Tuổi
                </label>
                <Select
                  value={selectedRating}
                  onValueChange={setSelectedRating}
                >
                  <SelectTrigger className="h-10 bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-400 font-medium">
                    <SelectValue placeholder="Tất Cả Xếp Hạng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất Cả Xếp Hạng</SelectItem>
                    <SelectItem value="P">P</SelectItem>
                    <SelectItem value="K">K</SelectItem>
                    <SelectItem value="T13">T13</SelectItem>
                    <SelectItem value="T16">T16</SelectItem>
                    <SelectItem value="T18">T18</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Genres Multi-select (compact) */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  🎬 Thể Loại
                </label>
                <div className="border border-purple-200 rounded-lg bg-white p-2 max-h-40 overflow-y-auto shadow-sm">
                  <div className="mb-2">
                    <Input
                      placeholder="Tìm kiếm..."
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      className="px-2 py-1 h-8 text-xs border-gray-200"
                    />
                  </div>
                  {filteredGenres.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2">
                      Không có thể loại
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {filteredGenres.map((genre: any) => {
                        const checked = selectedGenreIds.includes(genre.id);
                        return (
                          <label
                            key={genre.id}
                            className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md transition-all hover:bg-purple-50"
                          >
                            <div
                              className={`h-4 w-4 rounded border ${
                                checked
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {checked && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-xs text-gray-700">
                              {genre.name}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setSelectedGenreIds((prev) => [
                                    ...prev,
                                    genre.id,
                                  ]);
                                else
                                  setSelectedGenreIds((prev) =>
                                    prev.filter((id) => id !== genre.id)
                                  );
                              }}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active filters and clear button */}
            {(searchQuery ||
              selectedStatus !== 'all' ||
              selectedRating !== 'all' ||
              selectedGenreIds.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-200/50">
                {searchQuery && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                    <span className="text-xs text-gray-600">
                      Tìm kiếm:{' '}
                      <span className="font-semibold text-purple-700">
                        {searchQuery}
                      </span>
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {selectedStatus !== 'all' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                    <span className="text-xs text-gray-600">
                      Trạng Thái:{' '}
                      <span className="font-semibold text-purple-700">
                        {selectedStatus}
                      </span>
                    </span>
                    <button
                      onClick={() => setSelectedStatus('all')}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {selectedRating !== 'all' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                    <span className="text-xs text-gray-600">
                      Xếp Hạng:{' '}
                      <span className="font-semibold text-purple-700">
                        {selectedRating}
                      </span>
                    </span>
                    <button
                      onClick={() => setSelectedRating('all')}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {selectedGenreIds.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                    <span className="text-xs text-gray-600">
                      Thể loại:{' '}
                      <span className="font-semibold text-purple-700">
                        {selectedGenreIds.length}
                      </span>
                    </span>
                    <button
                      onClick={() => setSelectedGenreIds([])}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('all');
                    setSelectedRating('all');
                    setSelectedGenreIds([]);
                    setGenreSearch('');
                  }}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 ml-auto"
                >
                  ✕ Xóa Tất Cả
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">Đang tải...</div>
        ) : displayedMovies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            Không tìm thấy phim nào
          </div>
        ) : (
          displayedMovies.map((movie) => (
            <Card
              key={movie.id}
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white group flex flex-col h-full"
            >
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '2/3' }}
              >
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-700 to-gray-900">
                    <FilmIcon className="h-20 w-20 text-gray-400" />
                  </div>
                )}

                {!isManager && (
                  <div className="absolute top-3 right-3 z-30">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 hover:bg-white shadow-lg backdrop-blur"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(movie)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa phim
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMovieIdForRelease(movie.id);
                            setAddReleaseDialogOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Calendar className="mr-2 h-4 w-4" /> Lịch phát hành
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMovie(movie);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa phim
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none group-hover:pointer-events-auto">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                  <div className="relative h-full w-full flex items-center justify-center pointer-events-auto">
                    <div
                      className="w-full max-w-xl bg-black/60 rounded-lg p-4 text-center text-white shadow-2xl mx-4 overflow-y-auto"
                      style={{ maxHeight: '70%' }}
                    >
                      {ensureArray(movie.cast).length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-yellow-300 font-semibold mb-1 uppercase tracking-wider">
                            Diễn Viên
                          </p>
                          <p className="text-sm">
                            {ensureArray(movie.cast)
                              .slice(0, 6)
                              .map((a) =>
                                typeof a === 'object' && a && 'name' in a
                                  ? (a as { name?: string }).name
                                  : String(a)
                              )
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                      {getMovieGenreNames(movie).length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-yellow-300 font-semibold mb-1 uppercase tracking-wider">
                            Thể loại
                          </p>
                          <p className="text-sm">
                            {getMovieGenreNames(movie).join(', ')}
                          </p>
                        </div>
                      )}
                      {ensureArray(movie.spokenLanguages).length > 0 && (
                        <div>
                          <p className="text-xs text-yellow-300 font-semibold mb-1 uppercase tracking-wider">
                            Ngôn ngữ
                          </p>
                          <p className="text-sm">
                            {ensureArray(movie.spokenLanguages).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-base line-clamp-2 mb-2 text-gray-900">
                  {movie.title}
                </h3>
                {movie.displayDirector && (
                  <div className="mb-3 pb-2 border-b border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">
                        🎬 {movie.displayDirector}
                      </span>
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                  {movie.displayOverview
                    ? movie.displayOverview
                    : 'Không có mô tả'}
                </p>
                <div className="flex items-center justify-between text-xs bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">⏱</span>
                    <span className="font-semibold text-gray-800">
                      {movie.runtime} min
                    </span>
                  </div>
                  <div className="w-px h-5 bg-gray-300" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📊</span>
                    <span className="font-semibold text-gray-800">
                      {movie.ageRating}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về phim dưới đây
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu Đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Avatar: Dòng Nước"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalTitle">Tiêu Đề Gốc *</Label>
              <Input
                id="originalTitle"
                value={formData.originalTitle}
                onChange={(e) =>
                  setFormData({ ...formData, originalTitle: e.target.value })
                }
                placeholder="Avatar: The Way of Water"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overview">Mô Tả *</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) =>
                  setFormData({ ...formData, overview: e.target.value })
                }
                placeholder="Nhập mô tả phim..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="posterUrl">URL Poster *</Label>
                <Input
                  id="posterUrl"
                  value={formData.posterUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, posterUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backdropUrl">URL Hình Nền *</Label>
                <Input
                  id="backdropUrl"
                  value={formData.backdropUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, backdropUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trailerUrl">URL Trailer *</Label>
                <Input
                  id="trailerUrl"
                  value={formData.trailerUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, trailerUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="runtime">Thời Lượng (phút) *</Label>
                <Input
                  id="runtime"
                  type="number"
                  value={formData.runtime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      runtime: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageRating">Xếp Hạng Tuổi *</Label>
                <Select
                  value={formData.ageRating}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ageRating: value as AgeRating })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseDate">Ngày Phát Hành *</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={releaseDateValue}
                  onChange={(e) =>
                    setFormData({ ...formData, releaseDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalLanguage">Ngôn Ngữ Gốc *</Label>
                <Input
                  id="originalLanguage"
                  value={formData.originalLanguage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originalLanguage: e.target.value,
                    })
                  }
                  placeholder="en"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languageType">Loại Ngôn Ngữ *</Label>
                <Select
                  value={formData.languageType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      languageType: value as LanguageType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionCountry">Nước Sản Xuất *</Label>
                <Input
                  id="productionCountry"
                  value={formData.productionCountry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productionCountry: e.target.value,
                    })
                  }
                  placeholder="US"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="director">Đạo Diễn *</Label>
                <Input
                  id="director"
                  value={formData.director}
                  onChange={(e) =>
                    setFormData({ ...formData, director: e.target.value })
                  }
                  placeholder="Christopher Nolan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spokenLanguages">
                  Ngôn Ngữ Phát Âm * (cách nhau bằng dấu phẩy)
                </Label>
                <Input
                  id="spokenLanguages"
                  value={formData.spokenLanguages?.join(', ') || 'en'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      spokenLanguages: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="en, vi, zh"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diễn Viên *</Label>
              <div className="space-y-2">
                {(formData.cast || []).map((actor, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={actor.name}
                      onChange={(e) => {
                        const newCast = [...(formData.cast || [])];
                        newCast[index] = {
                          ...newCast[index],
                          name: e.target.value,
                        };
                        setFormData({ ...formData, cast: newCast });
                      }}
                      placeholder="Tên diễn viên"
                      className="flex-1"
                    />
                    <Input
                      value={actor.character || ''}
                      onChange={(e) => {
                        const newCast = [...(formData.cast || [])];
                        newCast[index] = {
                          ...newCast[index],
                          character: e.target.value,
                        };
                        setFormData({ ...formData, cast: newCast });
                      }}
                      placeholder="Tên vai (tùy chọn)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newCast = (formData.cast || []).filter(
                          (_, i) => i !== index
                        );
                        setFormData({ ...formData, cast: newCast });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      cast: [
                        ...(formData.cast || []),
                        { name: '', character: '' },
                      ],
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Diễn Viên
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thể Loại *</Label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Button
                    key={genre.id}
                    type="button"
                    variant={
                      formData.genreIds?.includes(genre.id)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        genreIds: formData.genreIds?.includes(genre.id)
                          ? formData.genreIds.filter((id) => id !== genre.id)
                          : [...(formData.genreIds || []), genre.id],
                      });
                    }}
                  >
                    {genre.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {selectedMovie ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa phim</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa &quot;{selectedMovie?.title}&quot; không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Release Dialog */}
      <MovieReleaseDialog
        open={addReleaseDialogOpen}
        onOpenChange={(open) => {
          setAddReleaseDialogOpen(open);
          if (!open) {
            setSelectedMovieIdForRelease('');
          }
        }}
        movies={movies}
        preSelectedMovieId={selectedMovieIdForRelease}
        onSuccess={() => {
          // Optionally refresh data or show success message
        }}
      />

      {/* Validation Error Dialog */}
      <Dialog open={validationErrorOpen} onOpenChange={setValidationErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validation Error</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">{validationErrorMessage}</p>
          <DialogFooter>
            <Button onClick={() => setValidationErrorOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

