'use client';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';
import { CinemaLocationResponse } from '@/types/cinema.type';
import { SearchIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useSearchCinemas } from '@/features/client/cinemas/hooks';
import { Loader } from '@/components/loader';

export const Search = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(''); // user đang gõ
  const [query, setQuery] = useState(''); // đã debounce
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // debounce query
  const handleSearch = useDebouncedCallback((value: string) => {
    setQuery(value.trim());
  }, 300);

  const handleChange = (value: string) => {
    setInputValue(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    // nếu muốn giữ popup mở thì bỏ dòng dưới
    setOpen(false);
  };

  const handleSelect = (cinema: CinemaLocationResponse) => {
    setOpen(false);
    router.push(`/cinemas/${cinema.id}`);
  };

  const {
    data: cinemas = [],
    isLoading,
    isFetching,
  } = useSearchCinemas(query || '');

  const showDropdown = open && inputValue.trim() !== '';

  return (
    <div className="relative flex items-center">
      {/* Icon search luôn hiển thị */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="text-white rounded-full z-10"
      >
        <SearchIcon className="w-6 h-6" />
      </Button>

      {/* Input overlay tuyệt đối, không chiếm layout */}
      <div
        className={`
          absolute right-0 top-full mt-2
          transition-opacity duration-200
          ${
            open
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }
        `}
      >
        <div className="bg-black/90 p-2 rounded-lg shadow-lg w-60 md:w-72">
          {/* Thanh input */}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Tìm rạp..."
              className="w-full"
            />
            <Button variant="outline" size="icon" onClick={handleClear}>
              <XIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Dropdown kết quả */}
          {showDropdown && (
            <div className="mt-2 max-h-60 overflow-y-auto border-t border-white/10 pt-1 custom-scroll">
              {(isLoading || isFetching) && (
                <div className="flex justify-center py-2">
                  <Loader size={32} />
                </div>
              )}

              {!isLoading && !isFetching && cinemas.length > 0 && (
                <div className="flex flex-col gap-1">
                  {cinemas.map((cinema) => (
                    <button
                      key={cinema.id}
                      type="button"
                      className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-white/10"
                      onClick={() => handleSelect(cinema)}
                    >
                      <div className="font-medium text-white">
                        {cinema.name}
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">
                        {cinema.address}
                        {cinema.district ? `, ${cinema.district}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isLoading && !isFetching && cinemas.length === 0 && query && (
                <p className="text-xs text-gray-400 px-2 py-2 text-center">
                  Không tìm thấy rạp phù hợp
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
