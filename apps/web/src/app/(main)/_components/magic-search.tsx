'use client';

import { useSearchCinemas } from '@/hooks/cinema-hooks';
import { useGetMovies } from '@/hooks/movie-hooks';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Loader2, SearchIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export const MagicSearch = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce input
  const handleDebounce = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value.trim());
  }, 300);

  const handleChange = (value: string) => {
    setInputValue(value);
    handleDebounce(value);
    if (!open && value.trim().length > 0) setOpen(true);
  };

  const handleClear = () => {
    setInputValue('');
    setDebouncedQuery('');
    setOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Data
  const { data: cinemas = [], isLoading: isLoadingCinemas } =
    useSearchCinemas(debouncedQuery);

  // Since we don't have a dedicated search endpoint for movies, we'll fetch "now_showing" and filter client-side.
  // This is a trade-off: efficient for top result only if search is supported, but here acts as a fallback.
  // Ideally, useGetMovies should support search param.
  const { data: moviesData, isLoading: isLoadingMovies } = useGetMovies({
    limit: 50, // Fetch a reasonable amount to filter from
    status: 'now_showing',
  });

  const allMovies = moviesData?.pages ?? [];

  // Client-side filter for movies
  const filteredMovies = debouncedQuery
    ? allMovies.filter((movie) =>
        movie.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [];

  const isLoading =
    (isLoadingCinemas || isLoadingMovies) && debouncedQuery.length > 0;
  const hasResults = filteredMovies.length > 0 || cinemas.length > 0;

  const handleSelectMovie = (id: string) => {
    router.push(`/movies/${id}`);
    handleClear();
  };

  const handleSelectCinema = (id: string) => {
    router.push(`/cinemas/${id}`);
    handleClear();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onFocus={() => {
            if (inputValue.trim().length > 0) setOpen(true);
          }}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Tìm phim đang chiếu, rạp gần bạn..."
          className="w-full bg-white text-black pl-10 pr-10 py-5 rounded-full border-none focus-visible:ring-2 focus-visible:ring-primary/50 placeholder:text-gray-500 shadow-lg"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 hover:bg-transparent text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}

        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {open && debouncedQuery && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Đang tìm kiếm...
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-gray-500">
              <span className="block text-2xl mb-2">🤔</span>
              <p className="text-sm">
                Không tìm thấy kết quả nào cho &quot;{debouncedQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto custom-scroll">
              {/* Movies Section */}
              {filteredMovies.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    Phim
                  </div>
                  <ul>
                    {filteredMovies.slice(0, 5).map((movie) => (
                      <li key={movie.id}>
                        <button
                          onClick={() => handleSelectMovie(movie.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                        >
                          <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden shadow-sm">
                            <Image
                              src={movie.posterUrl}
                              alt={movie.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 group-hover:text-primary line-clamp-1">
                              {movie.title}
                            </p>
                            {/* Optional: Add extra info like release date or rating if available in summary */}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cinemas Section */}
              {cinemas.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    Rạp chiếu
                  </div>
                  <ul>
                    {cinemas.slice(0, 5).map((cinema) => (
                      <li key={cinema.id}>
                        <button
                          onClick={() => handleSelectCinema(cinema.id)}
                          className="w-full px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <p className="text-sm font-bold text-gray-800">
                            {cinema.name}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {cinema.address}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
