'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';

import { Loader, MapPin, SlidersHorizontal } from 'lucide-react';
import { CinemaLocationCard } from '../_components/cinema-loaction-card';
import { useGetCinemasWithFilters } from '@/hooks/cinema-hooks';
import { CinemaLocationResponse } from '@/libs/types/cinema.type';

type SortBy = 'distance' | 'rating' | 'name';
type SortOrder = 'asc' | 'desc';

export default function CinemasFilterPage() {
  const router = useRouter();

  // ------ INPUT state (người dùng đang gõ) ------
  const [cityInput, setCityInput] = useState('');
  const [districtInput, setDistrictInput] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [hallTypesInput, setHallTypesInput] = useState('');

  // ------ DEBOUNCED state (đưa vào API) ------
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [amenities, setAmenities] = useState('');
  const [hallTypes, setHallTypes] = useState('');

  // Các filter khác có thể không cần debounce cũng được
  const [minRating, setMinRating] = useState('3');
  const [radius, setRadius] = useState('10');
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [lat, setLat] = useState<string | undefined>();
  const [lon, setLon] = useState<string | undefined>();

  // ------ Debounced setters ------
  const debouncedSetCity = useDebouncedCallback((value: string) => {
    setCity(value);
  }, 400);

  const debouncedSetDistrict = useDebouncedCallback((value: string) => {
    setDistrict(value);
  }, 400);

  const debouncedSetAmenities = useDebouncedCallback((value: string) => {
    setAmenities(value);
  }, 400);

  const debouncedSetHallTypes = useDebouncedCallback((value: string) => {
    setHallTypes(value);
  }, 400);

  const params = useMemo(
    () => ({
      lat,
      lon,
      radius,
      city: city || undefined,
      district: district || undefined,
      amenities: amenities || undefined,
      hallTypes: hallTypes || undefined,
      minRating: minRating || undefined,
      limit: 12,
      sortBy,
      sortOrder,
    }),
    [
      lat,
      lon,
      radius,
      city,
      district,
      amenities,
      hallTypes,
      minRating,
      sortBy,
      sortOrder,
    ]
  );

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useGetCinemasWithFilters(params);

  const cinemas: CinemaLocationResponse[] =
    data?.pages.flatMap((page) => page.cinemas) ?? [];

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLon(String(pos.coords.longitude));
      },
      () => {
        // TODO: toast lỗi nếu muốn
      }
    );
  };

  const handleSelectCinema = (cinemaId: string) => {
    router.push(`/cinemas/${cinemaId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-rose-950/40 to-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Khám phá rạp chiếu phim
            </h1>
            <p className="text-sm text-rose-100/70 mt-1">
              Lọc theo khu vực, tiện ích, đánh giá và khoảng cách để tìm rạp phù
              hợp nhất.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="
              gap-2
              border border-rose-500/40
              bg-rose-500/10
              text-rose-100
              hover:bg-rose-500/20 hover:border-rose-400
            "
            onClick={handleUseCurrentLocation}
          >
            <MapPin className="w-4 h-4" />
            Dùng vị trí hiện tại
          </Button>
        </header>

        {/* Filter bar */}
        <section
          className="
            rounded-2xl
            border border-rose-500/20
            bg-black/70
            p-4
            shadow-lg shadow-rose-500/15
            space-y-4
          "
        >
          <div className="flex items-center gap-2 text-sm text-rose-100">
            <div
              className="
                flex h-7 w-7 items-center justify-center
                rounded-full
                bg-rose-500/20
                border border-rose-500/40
              "
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-200" />
            </div>
            <span className="font-medium">Bộ lọc tìm rạp</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* City (debounced) */}
            <div className="space-y-1">
              <label className="text-xs text-rose-100/70">Thành phố</label>
              <Input
                placeholder="VD: Ho Chi Minh City"
                value={cityInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setCityInput(value);
                  debouncedSetCity(value);
                }}
                className="
                  bg-black/70
                  border border-rose-500/25
                  focus-visible:ring-rose-500/60
                  focus-visible:border-rose-400
                  text-sm
                "
              />
            </div>

            {/* District (debounced) */}
            <div className="space-y-1">
              <label className="text-xs text-rose-100/70">Quận / Huyện</label>
              <Input
                placeholder="VD: Tân Phú"
                value={districtInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setDistrictInput(value);
                  debouncedSetDistrict(value);
                }}
                className="
                  bg-black/70
                  border border-rose-500/25
                  focus-visible:ring-rose-500/60
                  focus-visible:border-rose-400
                  text-sm
                "
              />
            </div>

            {/* Min rating (không debounce cũng ok) */}
            <div className="space-y-1">
              <label className="text-xs text-rose-100/70">
                Đánh giá tối thiểu
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="
                  w-full rounded-md
                  border border-rose-500/25
                  bg-black/70
                  px-2 py-2 text-sm
                  text-rose-50
                  focus:outline-none
                  focus:ring-1 focus:ring-rose-500/60
                  focus:border-rose-400
                "
              >
                <option value="">Bất kỳ</option>
                <option value="3">⭐ 3.0+</option>
                <option value="3.5">⭐ 3.5+</option>
                <option value="4">⭐ 4.0+</option>
                <option value="4.5">⭐ 4.5+</option>
              </select>
            </div>

            {/* Radius */}
            <div className="space-y-1">
              <label className="text-xs text-rose-100/70">Bán kính (km)</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="
                  bg-black/70
                  border border-rose-500/25
                  focus-visible:ring-rose-500/60
                  focus-visible:border-rose-400
                  text-sm
                "
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Amenities (debounced) */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-rose-100/70">
                Tiện ích (ngăn cách bằng dấu phẩy)
              </label>
              <Input
                placeholder="VD: Parking, IMAX, Premium Lounge"
                value={amenitiesInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setAmenitiesInput(value);
                  debouncedSetAmenities(value);
                }}
                className="
                  bg-black/70
                  border border-rose-500/25
                  focus-visible:ring-rose-500/60
                  focus-visible:border-rose-400
                  text-sm
                "
              />
            </div>

            {/* Sort + hall types search (debounced) */}
            <div className="space-y-1">
              <label className="text-xs text-rose-100/70">
                Sắp xếp & loại phòng chiếu
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="
                      flex-1 rounded-md
                      border border-rose-500/25
                      bg-black/70
                      px-2 py-2 text-sm text-rose-50
                      focus:outline-none
                      focus:ring-1 focus:ring-rose-500/60
                      focus:border-rose-400
                    "
                  >
                    <option value="distance">Khoảng cách</option>
                    <option value="rating">Đánh giá</option>
                    <option value="name">Tên rạp</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="
                      w-24 rounded-md
                      border border-rose-500/25
                      bg-black/70
                      px-2 py-2 text-sm text-rose-50
                      focus:outline-none
                      focus:ring-1 focus:ring-rose-500/60
                      focus:border-rose-400
                    "
                  >
                    <option value="asc">Tăng</option>
                    <option value="desc">Giảm</option>
                  </select>
                </div>

                <Input
                  placeholder="Loại phòng: IMAX, 4DX..."
                  value={hallTypesInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHallTypesInput(value);
                    debouncedSetHallTypes(value);
                  }}
                  className="
                    bg-black/70
                    border border-rose-500/25
                    focus-visible:ring-rose-500/60
                    focus-visible:border-rose-400
                    text-sm
                  "
                />
              </div>
            </div>
          </div>
        </section>

        {/* List */}
        <section className="space-y-4 pb-10">
          {/* Loading skeleton lần đầu */}
          {isLoading && cinemas.length === 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CinemaLocationCard.Skeleton key={i} />
              ))}
            </div>
          )}

          {/* Không có kết quả */}
          {!isLoading && cinemas.length === 0 && (
            <div className="text-center text-sm text-rose-100/70 py-10">
              Không tìm thấy rạp nào phù hợp với bộ lọc hiện tại.
            </div>
          )}

          {/* Grid card */}
          {cinemas.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cinemas.map((cinema) => (
                <CinemaLocationCard
                  key={cinema.id}
                  cinema={cinema}
                  onSelect={handleSelectCinema}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="
                  border border-rose-500/40
                  bg-rose-500/10
                  text-rose-100
                  hover:bg-rose-500/20 hover:border-rose-400
                "
              >
                {isFetchingNextPage ? (
                  <span className="flex items-center gap-2">
                    <Loader size={20} /> Đang tải thêm...
                  </span>
                ) : (
                  'Xem thêm rạp'
                )}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
