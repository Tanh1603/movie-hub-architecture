'use client';

import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@movie-hub/shacdn-ui/alert-dialog';
import { Button } from '@movie-hub/shacdn-ui/button';
import { CalendarDays, Popcorn, Ticket } from 'lucide-react';
import { formatPrice } from '../../../utils/format-price';
import { bookingsApi } from '@/libs/api/services';
import { useGetBookingById } from '@/hooks/booking-hooks';
import { BookingStatus } from '@/libs/types/booking.type';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import { Loader } from '@/components/loader';
import { ErrorFallback } from '@/components/error-fallback';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function BookingCard({ bookingId }: { bookingId: string }) {
  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useGetBookingById(bookingId);
  const queryClient = useQueryClient();
  const [isRefundLoading, setIsRefundLoading] = useState(false);
  const [refundVoucher, setRefundVoucher] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Improve resolution
        useCORS: true,
        backgroundColor: '#ffffff', // White background for PDF
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            /* Container Overrides */
            .bg-slate-200\\/5 { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #0f172a !important; }
            .border-slate-200\\/10 { border-color: #e2e8f0 !important; }
            
            /* Text Color Overrides */
            .text-slate-100, .text-white, .text-slate-200, .text-neutral-200 { color: #0f172a !important; } /* slate-900 */
            .text-neutral-300, .text-neutral-400, .text-slate-300 { color: #475569 !important; } /* slate-600 */
            
            /* Badge & Item Overrides */
            .bg-slate-200\\/10 { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
            
            /* Orange Voucher Box */
            .bg-orange-500\\/10 { background-color: #fff7ed !important; border: 1px solid #fdba74 !important; }
            .bg-orange-500\\/20 { background-color: #fff7ed !important; border: 1px solid #fdba74 !important; }
            .text-orange-300 { color: #ea580c !important; }
            .border-orange-500\\/30, .border-orange-500\\/50 { border-color: #fdba74 !important; }
            
            /* Green Discount Box */
            .bg-green-500\\/10 { background-color: #f0fdf4 !important; border: 1px solid #86efac !important; }
            .text-green-300 { color: #166534 !important; }
            
            /* Icons */
            .lucide { color: #0f172a !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 20; // 20mm margin
      const availableWidth = pdfWidth - margin * 2;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = availableWidth / imgWidth;
      const finalHeight = imgHeight * ratio;

      pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, finalHeight);
      pdf.save(`booking-${booking?.bookingCode}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed', err);
      toast.error('Có lỗi xảy ra khi tải vé.');
    }
  };

  const handleRefund = async () => {
    if (!booking) return;

    // Client-side validation for 24h
    const showtimeDate = new Date(booking.startTime);
    const now = new Date();
    const hoursDiff =
      (showtimeDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff <= 24) {
      toast.error('Chỉ được hoàn vé trước giờ chiếu ít nhất 24 tiếng.');
      return;
    }

    try {
      setIsRefundLoading(true);
      const result = await bookingsApi.refundAsVoucher(
        booking.id,
        'User requested refund'
      );
      setRefundVoucher(result.voucher.code);
      toast.success('Hoàn vé thành công! Voucher của bạn đã được tạo.');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi hoàn vé');
    } finally {
      setIsRefundLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size={32} />
      </div>
    );

  if (isError) return <ErrorFallback message={error.message} />;

  const seatGroups = Object.values(
    booking?.seats.reduce((acc: any, seat) => {
      if (!acc[seat.ticketType]) {
        acc[seat.ticketType] = {
          type: seat.ticketType,
          quantity: 0,
          price: seat.price,
        };
      }
      acc[seat.ticketType].quantity += 1;
      return acc;
    }, {})
  );

  // Logic to check if refundable
  const isRefundable =
    booking?.status === BookingStatus.CONFIRMED &&
    new Date(booking.startTime).getTime() - new Date().getTime() >
      24 * 60 * 60 * 1000;

  return (
    <div className="space-y-4 w-full">
      <Card
        ref={cardRef}
        className="bg-slate-200/5 border border-slate-200/10 w-full"
      >
        {/* Header */}
        <CardHeader className="pb-4 border-b border-slate-200/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-slate-100 font-bold">
              {booking?.movieTitle}
            </CardTitle>
            {booking?.status === BookingStatus.REFUNDED && (
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">
                ĐÃ HOÀN VÉ
              </Badge>
            )}
          </div>

          <CardDescription className="text-neutral-400 text-sm">
            Mã vé:{' '}
            <span className="text-neutral-300">{booking?.bookingCode}</span>
            <br />
            {booking?.cinemaName} — {booking?.hallName}
          </CardDescription>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-6 mt-4">
          {/* Refund Voucher Display */}
          {(refundVoucher || booking?.status === BookingStatus.REFUNDED) && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-orange-300 font-semibold">
                <Ticket className="w-5 h-5" />
                <span>Voucher hoàn tiền</span>
              </div>
              <p className="text-sm text-neutral-300">
                Mã voucher:{' '}
                <span className="text-white font-mono font-bold text-lg">
                  {refundVoucher ||
                    booking?.refundVoucherCode ||
                    'Kiểm tra email của bạn'}
                </span>
              </p>
              <p className="text-xs text-neutral-400">
                Voucher có giá trị 100% tiền vé và có hạn 1 năm. Chỉ áp dụng cho
                tài khoản của bạn.
              </p>
            </div>
          )}

          {/* Showtime */}
          <div className="flex items-center gap-2 text-slate-300">
            <CalendarDays className="w-4 h-4 text-slate-100" />
            <span>
              {booking?.startTime
                ? new Date(booking?.startTime).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}{' '}
            </span>
          </div>

          {/* Seats */}
          <div>
            <p className="font-semibold text-sm text-white mb-1">
              Ghế đã chọn:
            </p>
            <div className="flex gap-2 flex-wrap">
              {booking?.seats.map((s: any) => (
                <span
                  key={s.seatId}
                  className="bg-slate-200/10 px-2 py-1 rounded text-slate-200 text-sm border border-slate-200/20"
                >
                  {s.row}
                  {s.number}
                </span>
              ))}
            </div>
          </div>

          {seatGroups.length > 0 && (
            <div>
              <p className="font-semibold text-sm text-white mb-2">Loại vé:</p>
              <div className="space-y-2">
                {seatGroups.map((seat: any) => (
                  <div
                    key={seat.type}
                    className="flex justify-between bg-slate-200/5 border border-slate-200/10 p-2 rounded text-sm gap-2"
                  >
                    <span className="text-neutral-300">
                      {seat.type} x{seat.quantity}
                    </span>
                    <span className="text-white font-semibold">
                      {formatPrice(seat.price * seat.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concessions */}
          <div>
            <p className="font-semibold text-sm text-white mb-1">Đồ ăn:</p>

            {(!booking?.concessions || booking.concessions.length === 0) && (
              <p className="text-neutral-500 italic">Không có</p>
            )}

            {booking?.concessions?.map((c: any) => (
              <div
                key={c.name}
                className="flex justify-between bg-slate-200/5 border border-slate-200/10 p-2 rounded text-sm"
              >
                <span className="text-slate-300">
                  <Popcorn className="w-4 h-4 inline mr-1 text-slate-100" />
                  {c.name} x{c.quantity}
                </span>
                <span className="text-white font-semibold">
                  {formatPrice(c.unitPrice * c.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div>
            <p className="font-semibold text-sm text-white mb-1">Giảm giá:</p>
            {booking?.discount === 0 && (
              <p className="text-neutral-500 italic">Không có</p>
            )}
            {booking?.discount && booking.discount > 0 && (
              <div className="flex justify-between bg-green-500/10 p-2 rounded text-sm">
                <span className="text-green-300">{booking.promotionCode}</span>
                <span className="text-green-300">
                  -{formatPrice(booking.discount)}
                </span>
              </div>
            )}
          </div>

          {/* Payment status */}
          {/* <div className="flex justify-between text-sm">
          <p className="text-white font-semibold">Trạng thái thanh toán:</p>
          <span className="text-neutral-300">{booking?.paymentStatus}</span>
        </div> */}
          {booking?.status === BookingStatus.CONFIRMED && (
            <div className="flex justify-center mt-4 bg-white/5 p-4 rounded-lg w-fit mx-auto">
              <QRCodeCanvas
                value={booking?.bookingCode || '—'}
                size={128}
                fgColor="#E2E8F0"
                bgColor="transparent"
              />
            </div>
          )}
        </CardContent>

        {/* Total */}
        <CardFooter className="pt-4 border-t border-slate-200/10">
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold text-white">Tổng tiền:</span>
            <span className="font-bold text-lg text-neutral-200">
              {formatPrice(booking?.finalAmount || 0)}
            </span>
          </div>
        </CardFooter>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleDownloadPDF} className="flex-1">
          Tải vé (PDF)
        </Button>

        {isRefundable && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-slate-200 text-slate-200 hover:bg-slate-200/10 hover:text-white"
              >
                Yêu cầu hoàn vé
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-slate-200/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">
                  Xác nhận hoàn vé
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-300">
                  Bạn có chắc chắn muốn hoàn vé này không?
                  <br />
                  <br />
                  Chính sách hoàn vé:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Chỉ áp dụng cho vé đặt trước giờ chiếu 24h.</li>
                    <li>
                      Hoàn tiền dưới dạng <strong>Voucher</strong> (Mã khuyến
                      mãi) trị giá 100% tiền vé.
                    </li>
                    <li>
                      Voucher có hạn sử dụng 1 năm và chỉ áp dụng cho tài khoản
                      của bạn.
                    </li>
                    <li>Tiền bắp nước (nếu có) sẽ không được hoàn lại.</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800">
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRefund}
                  disabled={isRefundLoading}
                  className="bg-slate-200 hover:bg-slate-100 text-slate-900 font-bold"
                >
                  {isRefundLoading ? 'Đang xử lý...' : 'Đồng ý hoàn vé'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
