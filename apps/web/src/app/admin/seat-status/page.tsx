'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Building2,
  DoorOpen,
  Wrench,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
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
import {
  useCinemas,
  useHallsByCinema,
  useUpdateSeatStatus,
  hallsApi,
} from '@/libs/api';
import type { SeatStatus, SeatType } from '@/libs/api/types';
import {
  SeatStatusEnum,
  SeatTypeEnum,
} from '@movie-hub/shared-types/cinema/enum';

// Frontend-specific types for seat status management
interface SeatDetail {
  id: string;
  row: number;
  seatNumber: number;
  type: SeatType;
  status: SeatStatus;
}

interface HallDetail {
  id: string;
  name: string;
  type: string;
  capacity: number;
  rows: number;
  status: string;
  seats: SeatDetail[];
}

export default function SeatStatusPage() {
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedHallId, setSelectedHallId] = useState('');
  const [hallDetail, setHallDetail] = useState<HallDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<SeatStatus | 'ALL'>('ALL');
  const { toast } = useToast();

  // API hooks
  const { data: cinemasData = [] } = useCinemas();
  const allCinemas = cinemasData || [];

  // RBAC State - use Clerk metadata directly
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string | undefined;
  const userCinemaId = user?.publicMetadata?.cinemaId as string | undefined;
  const isManager = userRole === 'CINEMA_MANAGER';

  // Filter cinemas for managers - only show their assigned cinema
  const cinemas =
    isManager && userCinemaId
      ? allCinemas.filter((c) => c.id === userCinemaId)
      : allCinemas;

  const { data: halls = [] } = useHallsByCinema(selectedCinemaId);
  const updateSeatMutation = useUpdateSeatStatus();

  // Auto-initialize selectedCinemaId for managers
  useEffect(() => {
    if (isManager && userCinemaId && !selectedCinemaId) {
      setSelectedCinemaId(userCinemaId);
    }
  }, [isManager, userCinemaId, selectedCinemaId]);

  useEffect(() => {
    // Reset selected hall and details when cinema changes
    setSelectedHallId('');
    setHallDetail(null);
  }, [selectedCinemaId]);

  const handleHallChange = async (hallId: string) => {
    try {
      setSelectedHallId(hallId);
      setLoading(true);

      // Fetch full hall detail to get real seatMap with actual seat UUIDs
      // useHallsByCinema returns summaries without seatMap
      const hallDetail = await hallsApi.getById(hallId);

      const hallSeats: SeatDetail[] = [];

      if (hallDetail.seatMap && hallDetail.seatMap.length > 0) {
        // Use actual seatMap from BE with real seat IDs
        hallDetail.seatMap.forEach((row, rowIndex) => {
          row.seats.forEach((seat) => {
            hallSeats.push({
              id: seat.id,
              row: rowIndex + 1,
              seatNumber: seat.seatNumber,
              type: seat.type,
              status: seat.status,
            });
          });
        });
      } else {
        // Fallback: if BE doesn't return seatMap, show error (BE issue)
        toast({
          title: 'Cảnh báo',
          description:
            'Không có sơ đồ ghế từ backend. Vui lòng kiểm tra với quản trị hệ thống.',
          variant: 'destructive',
        });
        return;
      }

      setHallDetail({
        id: hallDetail.id,
        name: hallDetail.name,
        type: hallDetail.type,
        capacity: hallDetail.capacity,
        rows: hallDetail.rows,
        status: hallDetail.status || 'ACTIVE',
        seats: hallSeats,
      });
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không tải được chi tiết phòng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSeatStatus = async (
    seatId: string,
    newStatus: SeatStatus
  ) => {
    try {
      await updateSeatMutation.mutateAsync({
        seatId,
        data: { status: newStatus },
      });

      if (hallDetail) {
        setHallDetail({
          ...hallDetail,
          seats: hallDetail.seats.map((seat) =>
            seat.id === seatId ? { ...seat, status: newStatus } : seat
          ),
        });
      }

      toast({
        title: 'Thành Công',
        description: 'Cập nhật trạng thái ghế thành công',
      });
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const getStatusColor = (status: SeatStatus) => {
    switch (status) {
      case SeatStatusEnum.ACTIVE:
        return 'bg-green-100 text-green-700 border-green-200';
      case SeatStatusEnum.BROKEN:
        return 'bg-red-100 text-red-700 border-red-200';
      case SeatStatusEnum.MAINTENANCE:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: SeatStatus) => {
    switch (status) {
      case SeatStatusEnum.ACTIVE:
        return <CheckCircle2 className="h-3 w-3" />;
      case SeatStatusEnum.BROKEN:
        return <XCircle className="h-3 w-3" />;
      case SeatStatusEnum.MAINTENANCE:
        return <Wrench className="h-3 w-3" />;
    }
  };

  const getSeatTypeColor = (type: SeatType) => {
    switch (type) {
      case SeatTypeEnum.VIP:
        return 'border-purple-500';
      case SeatTypeEnum.COUPLE:
        return 'border-pink-500';
      case SeatTypeEnum.PREMIUM:
        return 'border-yellow-500';
      case SeatTypeEnum.WHEELCHAIR:
        return 'border-blue-500';
      default:
        return 'border-gray-400';
    }
  };

  const getSeatStatusBgColor = (status: SeatStatus) => {
    switch (status) {
      case SeatStatusEnum.ACTIVE:
        return 'bg-emerald-500';
      case SeatStatusEnum.BROKEN:
        return 'bg-rose-600';
      case SeatStatusEnum.MAINTENANCE:
        return 'bg-amber-400';
      default:
        return 'bg-gray-400';
    }
  };

  const filteredSeats =
    hallDetail?.seats.filter(
      (seat) => filterStatus === 'ALL' || seat.status === filterStatus
    ) || [];

  const statusCounts = {
    ACTIVE:
      hallDetail?.seats.filter((s) => s.status === SeatStatusEnum.ACTIVE)
        .length || 0,
    BROKEN:
      hallDetail?.seats.filter((s) => s.status === SeatStatusEnum.BROKEN)
        .length || 0,
    MAINTENANCE:
      hallDetail?.seats.filter((s) => s.status === SeatStatusEnum.MAINTENANCE)
        .length || 0,
  };

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wrench className="h-8 w-8 text-orange-600" />
            Quản Lý Trạng Thái Ghế
          </h1>
          <p className="text-gray-500 mt-1">
            Giám sát và quản lý tình trạng ghế trên tất cả phòng
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chọn Phòng</CardTitle>
          <CardDescription>
            Chọn rạp và phòng để xem và quản lý trạng thái ghế
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Modern Filter Container */}
          <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  🏢 Rạp
                </label>
                <Select
                  value={selectedCinemaId}
                  onValueChange={setSelectedCinemaId}
                >
                  <SelectTrigger className="h-11 bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-400 font-medium">
                    <SelectValue placeholder="Chọn rạp" />
                  </SelectTrigger>
                  <SelectContent>
                    {cinemas.map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {cinema.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  🚪 Phòng
                </label>
                <Select
                  value={selectedHallId}
                  onValueChange={handleHallChange}
                  disabled={!selectedCinemaId}
                >
                  <SelectTrigger className="h-11 bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-400 font-medium disabled:opacity-50">
                    <SelectValue placeholder="Chọn phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4" />
                          {hall.name} - {hall.capacity} seats
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Đang tải chi tiết phòng...</p>
        </div>
      ) : hallDetail ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">
                    Tổng Số Ghế
                  </p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {hallDetail.seats.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-gray-600">
                      Hoạt Động
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {statusCounts.ACTIVE}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-gray-600">Bị Hỏng</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {statusCounts.BROKEN}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    <p className="text-sm font-medium text-gray-600">Bảo Trì</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {statusCounts.MAINTENANCE}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>{hallDetail.name} - Bố Trí Ghế</CardTitle>
                  <CardDescription>
                    {selectedCinema?.name} • {hallDetail.type} •{' '}
                    {hallDetail.capacity} ghế
                  </CardDescription>
                </div>
                {/* Modern Filter Section */}
                <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200/50 shadow-sm">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                    🔍 Lọc Ghế
                  </label>
                  <Select
                    value={filterStatus}
                    onValueChange={(v: string) =>
                      setFilterStatus(v as typeof filterStatus)
                    }
                  >
                    <SelectTrigger className="w-full md:w-48 h-10 bg-white border border-orange-200 hover:border-orange-300 focus:border-orange-400 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất Cả Ghế</SelectItem>
                      <SelectItem value={SeatStatusEnum.ACTIVE}>
                        ✅ Chỉ Hoạt Động
                      </SelectItem>
                      <SelectItem value={SeatStatusEnum.BROKEN}>
                        ❌ Chỉ Bị Hỏng
                      </SelectItem>
                      <SelectItem value={SeatStatusEnum.MAINTENANCE}>
                        🔧 Chỉ Bảo Trì
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {filterStatus !== 'ALL' && (
                    <div className="mt-2">
                      <button
                        onClick={() => setFilterStatus('ALL')}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-10">
                <div className="relative">
                  <div className="h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent mb-2"></div>
                  <div className="h-4 bg-gradient-to-b from-slate-600 to-transparent rounded-t-3xl"></div>
                </div>
                <p className="text-center text-sm text-gray-500 font-semibold tracking-wider mt-3">
                  🎬 SCREEN
                </p>
              </div>

              <div className="space-y-2.5 max-w-5xl mx-auto">
                {Array.from(new Set(filteredSeats.map((s) => s.row)))
                  .sort((a, b) => a - b)
                  .map((row) => (
                    <div key={row} className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <Badge
                          variant="outline"
                          className="font-mono font-bold text-base bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
                        >
                          {String.fromCharCode(64 + row)}
                        </Badge>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="flex gap-2">
                          {filteredSeats
                            .filter((s) => s.row === row)
                            .sort((a, b) => a.seatNumber - b.seatNumber)
                            .map((seat) => (
                              <div key={seat.id} className="group relative">
                                <button
                                  onClick={() => {
                                    const statuses: SeatStatus[] = [
                                      SeatStatusEnum.ACTIVE,
                                      SeatStatusEnum.BROKEN,
                                      SeatStatusEnum.MAINTENANCE,
                                    ];
                                    const currentIndex = statuses.indexOf(
                                      seat.status
                                    );
                                    const nextStatus =
                                      statuses[
                                        (currentIndex + 1) % statuses.length
                                      ];
                                    handleUpdateSeatStatus(seat.id, nextStatus);
                                  }}
                                  className={`
                                w-12 h-12 rounded-xl transition-all duration-300
                                flex items-center justify-center
                                border-2 ${getSeatTypeColor(seat.type)}
                                ${getSeatStatusBgColor(seat.status)}
                                ${
                                  seat.status === 'ACTIVE'
                                    ? 'hover:scale-125 hover:shadow-2xl hover:z-10'
                                    : 'opacity-70'
                                }
                                relative font-bold text-white shadow-md
                              `}
                                >
                                  <span className="text-sm drop-shadow-lg">
                                    {seat.seatNumber}
                                  </span>
                                  {seat.status !== SeatStatusEnum.ACTIVE && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="text-3xl opacity-40">
                                        {seat.status === SeatStatusEnum.BROKEN
                                          ? '✕'
                                          : '🔧'}
                                      </span>
                                    </div>
                                  )}
                                  {seat.type !== SeatTypeEnum.STANDARD && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-lg flex items-center justify-center text-[10px]">
                                      {seat.type === SeatTypeEnum.VIP
                                        ? '👑'
                                        : seat.type === SeatTypeEnum.COUPLE
                                        ? '💑'
                                        : seat.type === SeatTypeEnum.PREMIUM
                                        ? '⭐'
                                        : seat.type === SeatTypeEnum.WHEELCHAIR
                                        ? '♿'
                                        : ''}
                                    </div>
                                  )}
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-20 animate-in fade-in duration-200">
                                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl px-4 py-3 whitespace-nowrap shadow-2xl border border-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="font-bold text-lg">
                                        {String.fromCharCode(64 + seat.row)}
                                        {seat.seatNumber}
                                      </p>
                                      {seat.type !== SeatTypeEnum.STANDARD && (
                                        <span className="text-lg">
                                          {seat.type === SeatTypeEnum.VIP
                                            ? '👑'
                                            : seat.type === SeatTypeEnum.COUPLE
                                            ? '💑'
                                            : seat.type === SeatTypeEnum.PREMIUM
                                            ? '⭐'
                                            : seat.type ===
                                              SeatTypeEnum.WHEELCHAIR
                                            ? '♿'
                                            : ''}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-300 text-xs mb-2">
                                      {seat.type}
                                    </p>
                                    <Badge
                                      className={`${getStatusColor(
                                        seat.status
                                      )} text-xs mb-2`}
                                    >
                                      {getStatusIcon(seat.status)}
                                      <span className="ml-1">
                                        {seat.status}
                                      </span>
                                    </Badge>
                                    <div className="pt-2 border-t border-gray-700">
                                      <p className="text-amber-300 text-xs">
                                        👆 Click to cycle status
                                      </p>
                                    </div>
                                  </div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                    <div className="w-3 h-3 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="w-12 text-center">
                        <Badge
                          variant="outline"
                          className="font-mono font-bold text-base bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
                        >
                          {String.fromCharCode(64 + row)}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-8 pt-6 border-t space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Seat Types (Border Indicator)
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { type: SeatTypeEnum.STANDARD, emoji: '' },
                      { type: SeatTypeEnum.VIP, emoji: '👑' },
                      { type: SeatTypeEnum.COUPLE, emoji: '💑' },
                      { type: SeatTypeEnum.PREMIUM, emoji: '⭐' },
                      { type: SeatTypeEnum.WHEELCHAIR, emoji: '♿' },
                    ].map((item) => (
                      <div key={item.type} className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full border-2 ${getSeatTypeColor(
                            item.type
                          )} bg-gray-100 flex items-center justify-center text-lg shadow-sm`}
                        >
                          {item.emoji}
                        </div>
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Trạng Thái Vật Lý (Màu Nền)
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md"></div>
                      <span className="text-sm">Hoạt Động</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white text-2xl opacity-70 shadow-md">
                        ✕
                      </div>
                      <span className="text-sm">Bị Hỏng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-white text-2xl opacity-70 shadow-md">
                        🔧
                      </div>
                      <span className="text-sm">Bảo Trì</span>
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
            <DoorOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Chọn một rạp và phòng để xem trạng thái ghế
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
