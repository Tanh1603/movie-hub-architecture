'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Clock, Film, Building2, DoorOpen, Ticket } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { useToast } from '../_libs/use-toast';
import { format } from 'date-fns';
import { useShowtimes, useShowtimeSeats, useMovies, useHallsGroupedByCinema } from '@/libs/api';
import { useMemo } from 'react';
import type { TicketPricingDto, SeatRowDto, SeatItemDto, Showtime } from '@/libs/api/types';

type ReservationStatus = 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'CANCELLED';
type SeatType = 'STANDARD' | 'VIP' | 'COUPLE' | 'PREMIUM' | 'WHEELCHAIR';

export default function ShowtimeSeatsPage() {
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'ALL'>('ALL');
  useToast();

  // API hooks
  const { data: showtimesData = [] } = useShowtimes();
  const showtimes = showtimesData || [];
  const { data: seatsResponse, isLoading: loading } = useShowtimeSeats(selectedShowtimeId);
  const { data: moviesData = [] } = useMovies();
  const movies = moviesData || [];
  const { data: hallsByCinema = {} } = useHallsGroupedByCinema();
  const halls = useMemo(() => Object.values(hallsByCinema).flatMap((g: any) => (g.halls || [])), [hallsByCinema]);

  const movieMap = useMemo(() => {
    const m: Record<string,string> = {};
    movies.forEach((mv: any) => { if (mv?.id) m[mv.id] = mv.title || 'Không Xác Định'; });
    return m;
  }, [movies]);

  const hallMap = useMemo(() => {
    const m: Record<string,string> = {};
    (halls || []).forEach((h: any) => { if (h?.id) m[h.id] = h.name || 'Phòng Không Xác Định'; });
    return m;
  }, [halls]);

  const handleShowtimeChange = (showtimeId: string) => {
    setSelectedShowtimeId(showtimeId);
  };

  const getReservationStatusColor = (status: ReservationStatus | string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'HELD':
        return 'bg-amber-400 cursor-not-allowed';
      case 'CONFIRMED':
        return 'bg-gray-400 cursor-not-allowed';
      case 'CANCELLED':
        return 'bg-red-400 cursor-not-allowed';
      default:
        return 'bg-gray-300';
    }
  };

  const getSeatTypeColor = (type: SeatType | string) => {
    switch (type) {
      case 'VIP':
        return 'border-purple-500';
      case 'COUPLE':
        return 'border-pink-500';
      case 'PREMIUM':
        return 'border-yellow-500';
      case 'WHEELCHAIR':
        return 'border-blue-500';
      default:
        return 'border-gray-400';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Get ticket prices map
  const ticketPricesMap = seatsResponse?.ticketPrices?.reduce((acc: Record<string, number>, tp: TicketPricingDto) => {
    acc[tp.seatType] = tp.price;
    return acc;
  }, {}) || {};

  // Filter and group seats
  const filteredSeats = seatsResponse?.seat_map?.map((row: SeatRowDto) => ({
    ...row,
    seats: row.seats.filter((seat: SeatItemDto) =>
      filterStatus === 'ALL' || seat.reservationStatus === filterStatus
    ),
  })).filter((row: SeatRowDto) => row.seats.length > 0) || [];

  // Calculate status counts
  const statusCounts = seatsResponse ? {
    available: seatsResponse.seat_map.flatMap((r: SeatRowDto) => r.seats).filter((s: SeatItemDto) => s.reservationStatus === 'AVAILABLE' && s.seatStatus === 'ACTIVE').length,
    held: seatsResponse.seat_map.flatMap((r: SeatRowDto) => r.seats).filter((s: SeatItemDto) => s.reservationStatus === 'HELD').length,
    confirmed: seatsResponse.seat_map.flatMap((r: SeatRowDto) => r.seats).filter((s: SeatItemDto) => s.reservationStatus === 'CONFIRMED').length,
    unavailable: seatsResponse.seat_map.flatMap((r: SeatRowDto) => r.seats).filter((s: SeatItemDto) => s.seatStatus !== 'ACTIVE').length,
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Ticket className="h-8 w-8 text-blue-600" />
            Trình Xem Ghế Suất Chiếu
          </h1>
          <p className="text-gray-500 mt-1">Tính sẵn có ghế và trạng thái đặt vé trong thời gian thực</p>
        </div>
      </div>

      {/* Showtime Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chọn Suất Chiếu</CardTitle>
          <CardDescription>Chọn suất chiếu để xem tính sẵn có ghế</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedShowtimeId} onValueChange={handleShowtimeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn suất chiếu" />
            </SelectTrigger>
            <SelectContent>
              {showtimes.map((showtime: any) => {
                // TIMEZONE WORKAROUND: BE adds +7h in mapper, we need to subtract it
                const correctedStartTime = new Date(new Date(showtime.startTime || showtime.start_time || showtime.start).getTime() - 7 * 60 * 60 * 1000);
                return (
                  <SelectItem key={showtime.id} value={showtime.id}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{movieMap[showtime.movieId] || showtime.movieTitle || 'Không Xác Định'}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{hallMap[showtime.hallId] || showtime.hallName || 'Phòng Không Xác Định'}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{format(correctedStartTime, 'MMM dd, HH:mm')}</span>
                      {showtime.format && (
                        <>
                          <span className="text-gray-400">•</span>
                          <Badge variant="outline" className="text-xs">{showtime.format}</Badge>
                        </>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Đang tải thông tin ghế...</p>
        </div>
      ) : seatsResponse ? (
        <>
          {/* Showtime Info */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white">
                    <Film className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phim</p>
                    <p className="font-semibold text-gray-900">{seatsResponse.showtime.movieTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rạp</p>
                    <p className="font-semibold text-gray-900">{seatsResponse.cinemaName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white">
                    <DoorOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phòng</p>
                    <p className="font-semibold text-gray-900">{seatsResponse.hallName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Suất Chiếu</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(seatsResponse.showtime.start_time), 'HH:mm, MMM dd')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          {statusCounts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-emerald-200 bg-emerald-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Sẵn Có</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{statusCounts.available}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Giữ Chỗ</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{statusCounts.held}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Đã Đặt</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{statusCounts.confirmed}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200 bg-gray-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Không Sẵn Có</p>
                    <p className="text-3xl font-bold text-gray-600 mt-2">{statusCounts.unavailable}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seat Map */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sơ Đồ Ghế</CardTitle>
                  <CardDescription>
                    Tính sẵn có ghế theo thời gian thực • Thời gian giữ chỗ: {seatsResponse.rules.hold_time_seconds}s • Tối đa: {seatsResponse.rules.max_selectable} ghế
                  </CardDescription>
                </div>
                <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v as typeof filterStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất Cả Ghế</SelectItem>
                    <SelectItem value="AVAILABLE">Chỉ Ghế Trống</SelectItem>
                    <SelectItem value="HELD">Đang Giữ Chỗ</SelectItem>
                    <SelectItem value="CONFIRMED">Đã Đặt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Screen */}
              <div className="mb-10">
                <div className="relative">
                  <div className="h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent mb-2"></div>
                  <div className="h-4 bg-gradient-to-b from-slate-600 to-transparent rounded-t-3xl"></div>
                </div>
                <p className="text-center text-sm text-gray-500 font-semibold tracking-wider mt-3">🎬 MÀN HÌNH</p>
              </div>

              {/* Seat Grid */}
              <div className="space-y-2.5 max-w-5xl mx-auto">
                {filteredSeats.map((row: SeatRowDto) => (
                  <div key={row.row} className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      <Badge variant="outline" className="font-mono font-bold text-base bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        {row.row}
                      </Badge>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex gap-2">
                        {row.seats.map((seat: SeatItemDto) => {
                          const isUnavailable = seat.seatStatus !== 'ACTIVE' || 
                                              seat.reservationStatus === 'CONFIRMED' || 
                                              seat.reservationStatus === 'CANCELLED';
                          const isHeld = seat.reservationStatus === 'HELD';

                          return (
                            <div key={seat.id} className="group relative">
                              <button
                                disabled={isUnavailable || isHeld}
                                className={`
                                  w-12 h-12 rounded-xl transition-all duration-300
                                  flex items-center justify-center
                                  border-2 ${getSeatTypeColor(seat.seatType)}
                                  ${getReservationStatusColor(seat.reservationStatus)}
                                  ${!isUnavailable && !isHeld ? 'hover:scale-125 hover:shadow-2xl hover:z-10' : ''}
                                  relative font-bold text-white
                                  shadow-md
                                `}
                              >
                                <span className="text-sm drop-shadow-lg">
                                  {seat.number}
                                </span>

                                {seat.seatStatus !== 'ACTIVE' && (
                                  <div className={`absolute inset-0 rounded-xl opacity-40 ${
                                    seat.seatStatus === 'BROKEN' ? 'bg-gradient-to-br from-red-500 to-red-700' :
                                    'bg-gradient-to-br from-amber-500 to-amber-700'
                                  }`}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-2xl">
                                        {seat.seatStatus === 'BROKEN' ? '✕' : '🔧'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Seat type indicator */}
                                {seat.seatType !== 'STANDARD' && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-lg flex items-center justify-center text-[10px]">
                                    {seat.seatType === 'VIP' ? '👑' :
                                     seat.seatType === 'COUPLE' ? '💑' :
                                     seat.seatType === 'PREMIUM' ? '⭐' :
                                     seat.seatType === 'WHEELCHAIR' ? '♿' : ''}
                                  </div>
                                )}
                              </button>

                              {/* Enhanced Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-20">
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl px-4 py-3 whitespace-nowrap shadow-2xl border border-gray-700">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-bold text-lg">{row.row}{seat.number}</p>
                                    {seat.seatType !== 'STANDARD' && (
                                      <span className="text-lg">
                                        {seat.seatType === 'VIP' ? '👑' :
                                         seat.seatType === 'COUPLE' ? '💑' :
                                         seat.seatType === 'PREMIUM' ? '⭐' :
                                         seat.seatType === 'WHEELCHAIR' ? '♿' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-300 text-xs mb-2">{seat.seatType}</p>
                                  <div className="flex items-center gap-2 mb-2">
                                    {seat.seatStatus === 'ACTIVE' ? (
                                      <Badge className={`text-xs ${
                                        seat.reservationStatus === 'AVAILABLE' ? 'bg-emerald-600' :
                                        seat.reservationStatus === 'HELD' ? 'bg-amber-500' :
                                        seat.reservationStatus === 'CONFIRMED' ? 'bg-blue-600' :
                                        'bg-red-600'
                                      }`}>
                                        {seat.reservationStatus}
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        {seat.seatStatus}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="pt-2 border-t border-gray-700">
                                    <p className="text-emerald-400 font-bold text-base">
                                      {formatPrice(ticketPricesMap[seat.seatType] || 0)}
                                    </p>
                                  </div>
                                </div>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                  <div className="w-3 h-3 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="w-12 text-center">
                      <Badge variant="outline" className="font-mono font-bold text-base bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        {row.row}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legends */}
              <div className="mt-8 pt-6 border-t space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Loại Ghế</p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { seatType: 'STANDARD', label: 'Ghế Thường', emoji: '' },
                      { seatType: 'VIP', label: 'Ghế VIP', emoji: '👑' },
                      { seatType: 'COUPLE', label: 'Ghế Đôi', emoji: '💑' },
                      { seatType: 'PREMIUM', label: 'Ghế Premium', emoji: '⭐' },
                      { seatType: 'WHEELCHAIR', label: 'Ghế Xe Lăn', emoji: '♿' },
                    ].map(item => (
                      <div key={item.seatType} className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full border-2 ${getSeatTypeColor(item.seatType)} bg-gray-100 flex items-center justify-center text-lg shadow-sm`}>
                          {item.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-gray-500">{formatPrice(ticketPricesMap[item.seatType] || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Trạng Thái Đặt Vé</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-emerald-500"></div>
                      <span className="text-sm">Trống</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-amber-400"></div>
                      <span className="text-sm">Đang Giữ Chỗ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gray-400"></div>
                      <span className="text-sm">Đã Đặt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-red-400"></div>
                      <span className="text-sm">Không Sẵn Có</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chọn một suất chiếu để xem tính sẵn có ghế</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
