'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Eye, CheckCircle, Clock, Calendar, ArrowUpDown } from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movie-hub/shacdn-ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@movie-hub/shacdn-ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  useBookings,
  useBookingById,
  useUpdateBookingStatus,
  useConfirmBooking,
  useCinemas,
} from '@/libs/api';
import type { BookingStatus, PaymentStatus } from '@/libs/api/types';
import {
  BookingStatus as BookingStatusEnum,
  PaymentStatus as PaymentStatusEnum,
} from '@movie-hub/shared-types/booking/enum';

export default function ReservationsPage() {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    bookingId: '',
    status: BookingStatusEnum.CONFIRMED as BookingStatus,
    reason: '',
  });

  // Filters
  const [filterCinemaId, setFilterCinemaId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterShowtimeId, setFilterShowtimeId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<
    'created_at' | 'final_amount' | 'expires_at'
  >('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // const { toast } = useToast();

  // API hooks
  const { data: cinemasData = [] } = useCinemas();
  const allCinemas = Array.isArray(cinemasData) ? cinemasData : [];

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

  // Auto-initialize filterCinemaId for managers (lock to their cinema)
  useEffect(() => {
    if (isManager && userCinemaId && filterCinemaId === 'all') {
      setFilterCinemaId(userCinemaId);
    }
  }, [isManager, userCinemaId, filterCinemaId]);

  const { data: bookingsData = [], isLoading: loading } = useBookings({
    cinemaId: filterCinemaId === 'all' ? undefined : filterCinemaId,
    showtimeId: filterShowtimeId || undefined,
    status:
      filterStatus === 'all' ? undefined : (filterStatus as BookingStatus),
    paymentStatus:
      filterPaymentStatus === 'all'
        ? undefined
        : (filterPaymentStatus as PaymentStatus),
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    sortBy,
    sortOrder,
    page,
  });
  const bookings = useMemo(() => bookingsData || [], [bookingsData]);

  const { data: bookingDetail, isLoading: detailLoading } =
    useBookingById(selectedBookingId);
  const updateStatus = useUpdateBookingStatus();
  const confirmBooking = useConfirmBooking();

  // Calculate statistics based on filtered data
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter(
        (b) => b.status === BookingStatusEnum.CONFIRMED
      ).length,
      pending: bookings.filter((b) => b.status === BookingStatusEnum.PENDING)
        .length,
      cancelled: bookings.filter(
        (b) => b.status === BookingStatusEnum.CANCELLED
      ).length,
      completed: bookings.filter(
        (b) => b.status === BookingStatusEnum.COMPLETED
      ).length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      avgBookingValue:
        bookings.length > 0
          ? bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) /
            bookings.length
          : 0,
      totalSeats: bookings.reduce((sum, b) => sum + (b.seatCount || 0), 0),
    };
  }, [bookings]);

  const handleViewDetail = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdate.bookingId) return;

    try {
      await updateStatus.mutateAsync({
        id: statusUpdate.bookingId,
        data: {
          status: statusUpdate.status,
          reason: statusUpdate.reason || undefined,
        },
      });
      setStatusDialogOpen(false);
      setDetailDialogOpen(false);
      setStatusUpdate({
        bookingId: '',
        status: BookingStatusEnum.CONFIRMED,
        reason: '',
      });
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmBooking.mutateAsync(bookingId);
      setDetailDialogOpen(false);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const openStatusDialog = (
    bookingId: string,
    currentStatus: BookingStatus
  ) => {
    setStatusUpdate({
      bookingId,
      status: currentStatus,
      reason: '',
    });
    setStatusDialogOpen(true);
  };

  const handleClearFilters = () => {
    setFilterCinemaId('all');
    setFilterStatus('all');
    setFilterPaymentStatus('all');
    setFilterShowtimeId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(1);
  };

  const getStatusBadgeColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatusEnum.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BookingStatusEnum.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatusEnum.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BookingStatusEnum.EXPIRED:
        return 'bg-gray-100 text-gray-800';
      case BookingStatusEnum.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatusEnum.COMPLETED:
        return 'bg-green-100 text-green-800';
      case PaymentStatusEnum.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatusEnum.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case PaymentStatusEnum.FAILED:
        return 'bg-red-100 text-red-800';
      case PaymentStatusEnum.REFUNDED:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    // TIMEZONE WORKAROUND: BE adds +7h in mapper, we need to subtract it
    const dateObj = new Date(date);
    const correctedDate = new Date(dateObj.getTime() - 7 * 60 * 60 * 1000);
    return correctedDate.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đặt Chỗ</h1>
          <p className="text-gray-500 mt-1">Quản lý đặt vé và đặt chỗ rạp</p>
        </div>
      </div>

      {/* Statistics Cards with Modern Gradient Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider">
              � Tổng Đặt Chỗ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {stats.total}
            </div>
            <p className="text-xs text-purple-600 mt-2 font-medium">
              {stats.confirmed} đã xác nhận · {stats.pending} chờ xử lý
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
              💰 Tổng Doanh Thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {formatPrice(stats.totalRevenue)}
            </div>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              Trung bình: {formatPrice(stats.avgBookingValue)} mỗi đơn
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
              ✅ Hoàn Thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {stats.completed}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              Hoàn thành thành công
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-pink-700 uppercase tracking-wider">
              🪑 Ghế đã đặt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900">
              {stats.totalSeats}
            </div>
            <p className="text-xs text-pink-600 mt-2 font-medium">
              Avg: {(stats.totalSeats / stats.total || 0).toFixed(1)} seats per
              booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Filter Container */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Cinema Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              � Rạp
            </label>
            <Select
              value={filterCinemaId}
              onValueChange={(value) => {
                setFilterCinemaId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Rạp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Rạp</SelectItem>
                {cinemas.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Booking Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              📋 Trạng Thái Đặt Vé
            </label>
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Trạng Thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                <SelectItem value={BookingStatusEnum.PENDING}>
                  ⏳ Chờ Xử Lý
                </SelectItem>
                <SelectItem value={BookingStatusEnum.CONFIRMED}>
                  ✅ Đã Xác Nhận
                </SelectItem>
                <SelectItem value={BookingStatusEnum.CANCELLED}>
                  ❌ Đã Hủy
                </SelectItem>
                <SelectItem value={BookingStatusEnum.EXPIRED}>
                  ⏱️ Đã Hết Hạn
                </SelectItem>
                <SelectItem value={BookingStatusEnum.COMPLETED}>
                  🎬 Hoàn Thành
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              💳 Trạng Thái Thanh Toán
            </label>
            <Select
              value={filterPaymentStatus}
              onValueChange={(value) => {
                setFilterPaymentStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Thanh Toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Thanh Toán</SelectItem>
                <SelectItem value={PaymentStatusEnum.PENDING}>
                  ⏳ Chờ Xử Lý
                </SelectItem>
                <SelectItem value={PaymentStatusEnum.PROCESSING}>
                  ⚙️ Đang Xử Lý
                </SelectItem>
                <SelectItem value={PaymentStatusEnum.COMPLETED}>
                  ✅ Hoàn Thành
                </SelectItem>
                <SelectItem value={PaymentStatusEnum.FAILED}>
                  ❌ Thất Bại
                </SelectItem>
                <SelectItem value={PaymentStatusEnum.REFUNDED}>
                  🔄 Đã Hoàn Tiền
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              📅 Ngày Bắt Đầu
            </label>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setPage(1);
              }}
              className="h-11 border-purple-200 focus:ring-purple-500"
            />
          </div>

          {/* End Date Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              📅 Ngày Kết Thúc
            </label>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setPage(1);
              }}
              className="h-11 border-purple-200 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filterCinemaId !== 'all' ||
          filterStatus !== 'all' ||
          filterPaymentStatus !== 'all' ||
          filterStartDate ||
          filterEndDate) && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-200/50">
            {filterCinemaId !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  🏢 {cinemas.find((c) => c.id === filterCinemaId)?.name}
                </span>
                <button
                  onClick={() => {
                    setFilterCinemaId('all');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterStatus !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  📋{' '}
                  {filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()}
                </span>
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterPaymentStatus !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  💳{' '}
                  {filterPaymentStatus.charAt(0) +
                    filterPaymentStatus.slice(1).toLowerCase()}
                </span>
                <button
                  onClick={() => {
                    setFilterPaymentStatus('all');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterStartDate && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  📅 From {filterStartDate}
                </span>
                <button
                  onClick={() => {
                    setFilterStartDate('');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterEndDate && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  📅 To {filterEndDate}
                </span>
                <button
                  onClick={() => {
                    setFilterEndDate('');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors ml-auto"
            >
              Xóa Tất Cả
            </button>
          </div>
        )}
      </div>

      {/* Pagination & Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div>
              <Label htmlFor="filter-sort">Sắp Xếp Theo</Label>
              <Select
                value={sortBy}
                onValueChange={(
                  value: 'created_at' | 'final_amount' | 'expires_at'
                ) => setSortBy(value)}
              >
                <SelectTrigger id="filter-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Ngày Tạo</SelectItem>
                  <SelectItem value="final_amount">Số Tiền</SelectItem>
                  <SelectItem value="expires_at">Thời Hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
              }
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'desc' ? 'Mới Nhất' : 'Cũ Nhất'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Đặt Chỗ</CardTitle>
          <CardDescription>
            {bookings.length} đơn đặt chỗ được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Đang tải đặt chỗ...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Không tìm thấy đặt chỗ với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Đặt</TableHead>
                    <TableHead>Phim</TableHead>
                    <TableHead>Rạp</TableHead>
                    <TableHead>Suất Chiếu</TableHead>
                    <TableHead>Ghế</TableHead>
                    <TableHead>Số Tiền</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Tạo Lúc</TableHead>
                    <TableHead>Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.bookingCode}
                      </TableCell>
                      <TableCell>{booking.movieTitle}</TableCell>
                      <TableCell>{booking.cinemaName}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(booking.startTime)}
                      </TableCell>
                      <TableCell className="text-center">
                        {booking.seatCount}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(booking.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(booking.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(booking.id)}
                            className="h-8 w-8 p-0"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === BookingStatusEnum.PENDING && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirm(booking.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Xác nhận đặt vé"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openStatusDialog(booking.id, booking.status)
                            }
                            className="h-8 w-8 p-0"
                            title="Đổi trạng thái"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Đặt Vé</DialogTitle>
            <DialogDescription>Xem thông tin đặt vé đầy đủ</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Đang tải chi tiết...</p>
            </div>
          ) : bookingDetail ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Mã Đặt Vé</Label>
                  <p className="font-medium">{bookingDetail.bookingCode}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Trạng Thái</Label>
                  <div>
                    <Badge
                      className={getStatusBadgeColor(bookingDetail.status)}
                    >
                      {bookingDetail.status}
                    </Badge>
                    <Badge
                      className={`ml-2 ${getPaymentStatusBadge(
                        bookingDetail.paymentStatus
                      )}`}
                    >
                      {bookingDetail.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Movie & Cinema Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Phim</Label>
                  <p className="font-medium">{bookingDetail.movieTitle}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Rạp</Label>
                  <p className="font-medium">{bookingDetail.cinemaName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Phòng</Label>
                  <p className="font-medium">{bookingDetail.hallName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Suất Chiếu</Label>
                  <p className="font-medium">
                    {formatDate(bookingDetail.startTime)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Thông Tin Khách Hàng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Tên</Label>
                    <p>{bookingDetail.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p>{bookingDetail.customerEmail}</p>
                  </div>
                  {bookingDetail.customerPhone && (
                    <div>
                      <Label className="text-sm text-gray-500">
                        Số Điện Thoại
                      </Label>
                      <p>{bookingDetail.customerPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seats */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Ghế</h3>
                <div className="grid grid-cols-3 gap-2">
                  {bookingDetail.seats &&
                    bookingDetail.seats.map((seat, idx: number) => (
                      <div key={idx} className="border p-2 rounded text-sm">
                        <p className="font-medium">
                          {String(seat.row)}
                          {seat.number}
                        </p>
                        <p className="text-xs text-gray-500">{seat.seatType}</p>
                        <p className="text-xs font-semibold">
                          {formatPrice(seat.price)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Concessions */}
              {bookingDetail.concessions &&
                bookingDetail.concessions.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Mặt Hàng Bổ Sung</h3>
                    {bookingDetail.concessions.map((item, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between py-1 text-sm"
                      >
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              {/* Pricing */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Định Giá</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Cộng Tiền</span>
                    <span className="font-medium">
                      {formatPrice(bookingDetail.subtotal || 0)}
                    </span>
                  </div>
                  {bookingDetail.discount && bookingDetail.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm Giá</span>
                      <span>-{formatPrice(bookingDetail.discount)}</span>
                    </div>
                  )}
                  {bookingDetail.pointsUsed && bookingDetail.pointsUsed > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>
                        Giảm Giá Điểm ({bookingDetail.pointsUsed} điểm)
                      </span>
                      <span>
                        -{formatPrice(bookingDetail.pointsDiscount || 0)}
                      </span>
                    </div>
                  )}
                  {bookingDetail.promotionCode && (
                    <div className="flex justify-between text-purple-600 py-1">
                      <span>Khuyến Mãi: {bookingDetail.promotionCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Tổng Tiền</span>
                    <span className="text-green-600">
                      {formatPrice(
                        bookingDetail.finalAmount ||
                          bookingDetail.totalAmount ||
                          0
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Tạo Lúc:</span>
                  <span>{formatDate(bookingDetail.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cập Nhật Lúc:</span>
                  <span>{formatDate(bookingDetail.updatedAt)}</span>
                </div>
                {bookingDetail.expiresAt && (
                  <div className="flex justify-between">
                    <span>Hết Hạn:</span>
                    <span>{formatDate(bookingDetail.expiresAt)}</span>
                  </div>
                )}
                {bookingDetail.cancelledAt && (
                  <div className="flex justify-between text-red-600">
                    <span>Đã Hủy:</span>
                    <span>{formatDate(bookingDetail.cancelledAt)}</span>
                  </div>
                )}
                {bookingDetail.cancellationReason && (
                  <div className="mt-2">
                    <Label className="text-sm">Lý Do Hủy:</Label>
                    <p className="text-red-600">
                      {bookingDetail.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {bookingDetail?.status === 'PENDING' && (
              <Button
                onClick={() => handleConfirm(bookingDetail.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                Xác Nhận Đặt Vé
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                bookingDetail &&
                openStatusDialog(bookingDetail.id, bookingDetail.status)
              }
            >
              Thay Đổi Trạng Thái
            </Button>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay Đổi Trạng Thái Đặt Vé</DialogTitle>
            <DialogDescription>
              Đổi trạng thái đặt vé và cung cấp lý do
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-status">Trạng Thái Mới</Label>
              <Select
                value={statusUpdate.status}
                onValueChange={(value: BookingStatus) =>
                  setStatusUpdate({ ...statusUpdate, status: value })
                }
              >
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ Xử Lý</SelectItem>
                  <SelectItem value="CONFIRMED">Đã Xác Nhận</SelectItem>
                  <SelectItem value="CANCELLED">Đã Hủy</SelectItem>
                  <SelectItem value="EXPIRED">Đã Hết Hạn</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn Thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Lý Do (Tùy Chọn)</Label>
              <Input
                id="reason"
                value={statusUpdate.reason}
                onChange={(e) =>
                  setStatusUpdate({ ...statusUpdate, reason: e.target.value })
                }
                placeholder="Nhập lý do thay đổi trạng thái"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Hủy Bỏ
            </Button>
            <Button
              onClick={handleUpdateStatus}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending
                ? 'Đang Cập Nhật...'
                : 'Cập Nhật Trạng Thái'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
