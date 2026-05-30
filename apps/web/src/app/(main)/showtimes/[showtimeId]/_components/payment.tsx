'use client';

import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';
import { cn } from '@movie-hub/shacdn-utils';
import { BookingCalculationDto } from '@movie-hub/shared-types';
import { AlertTriangle } from 'lucide-react';
import Loading from '@/components/loading';
import { useUpdateBooking } from '@/features/client/booking/hooks';
import { useCreatePayment } from '@/features/client/payments/hooks';
import { useValidationPromotion } from '@/features/client/promotions/hooks';
import {
  PaymentMethod,
  paymentMethods,
  PaymentMethodUI,
} from '@/types/payment.type';
import { useBookingStore } from '@/stores/booking-store';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const PaymentSection = ({
  existingBooking,
}: {
  existingBooking?: BookingCalculationDto | null;
}) => {
  const {
    getTotalFinal,
    buildBookingPayload,
    bookingId,
    getVoucherExcessAmount,
  } = useBookingStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [voucher, setVoucher] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedPendingPaymentUrl, setStoredPendingPaymentUrl] = useState<
    string | undefined
  >();

  const { mutateAsync, isPending } = useValidationPromotion();
  const voucherExcess = getVoucherExcessAmount();
  const totalFinal = getTotalFinal();
  const isZeroCostOrder = totalFinal === 0;
  const canUseStoredPendingPaymentUrl =
    !existingBooking || existingBooking.paymentStatus === 'PENDING';
  const pendingPaymentUrl =
    existingBooking?.payment?.status === 'PENDING'
      ? existingBooking.payment.paymentUrl || storedPendingPaymentUrl
      : canUseStoredPendingPaymentUrl
      ? storedPendingPaymentUrl
      : undefined;

  useEffect(() => {
    if (!bookingId) {
      setStoredPendingPaymentUrl(undefined);
      return;
    }

    setStoredPendingPaymentUrl(
      window.sessionStorage.getItem(`pendingPaymentUrl:${bookingId}`) ||
        undefined
    );
  }, [bookingId]);

  const handleValidatePromotion = async (code: string) => {
    await mutateAsync({
      code: code.trim(),
      validateDto: {
        bookingAmount: getTotalFinal(),
      },
    });
  };

  const handleSelect = (payment: PaymentMethodUI) => {
    if (!payment.supported) {
      toast.error('Phương thức thanh toán này hiện chưa được hỗ trợ.');
      return;
    }
    setSelectedMethod(payment.method);
  };

  const updateBookingMutation = useUpdateBooking();
  const createPayment = useCreatePayment();

  const handlePay = async () => {
    if (pendingPaymentUrl) {
      window.location.href = pendingPaymentUrl;
      return;
    }

    // For zero-cost orders, payment method selection is optional
    if (!isZeroCostOrder && !selectedMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán.');
      return;
    }

    if (!bookingId) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      return;
    }
    console.log('Starting payment process for bookingId:', bookingId);
    try {
      setIsLoading(true);
      await updateBookingMutation.mutateAsync({
        bookingId,
        data: buildBookingPayload(),
      });

      // For zero-cost orders, we still need to create a payment record
      // but with amount 0 - the backend should handle this gracefully
      const payment = await createPayment.mutateAsync({
        bookingId,
        data: {
          paymentMethod: selectedMethod || PaymentMethod.VNPAY,
          amount: totalFinal,
          returnUrl: `${window.location.origin}/checkout?success=true&bookingId=${bookingId}`,
          cancelUrl: `${window.location.origin}/checkout?success=false&bookingId=${bookingId}`,
        },
      });

      if (payment && payment.data && payment.data.paymentUrl) {
        window.sessionStorage.setItem(
          `pendingPaymentUrl:${bookingId}`,
          payment.data.paymentUrl
        );
        window.location.href = payment.data.paymentUrl;
      } else {
        toast.error('Không thể tạo thanh toán. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (pendingPaymentUrl) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-4 text-neutral-300">
          Giao dich thanh toan dang cho xu ly. Ban co the tiep tuc cong thanh
          toan hien co.
        </div>
        <Button onClick={handlePay} className="w-full">
          Tiep tuc thanh toan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Warning when voucher exceeds bill */}
      {voucherExcess > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-300 font-semibold">
              Giá trị voucher vượt quá đơn hàng
            </p>
            <p className="text-amber-200/80 mt-1">
              Voucher của bạn có giá trị cao hơn đơn hàng{' '}
              <span className="font-bold text-amber-300">
                {voucherExcess.toLocaleString('vi-VN')} VND
              </span>
              . Phần dư này sẽ không được hoàn lại. Bạn có thể thêm đồ ăn/nước
              uống để tận dụng tối đa giá trị voucher.
            </p>
          </div>
        </div>
      )}

      {/* Zero-cost order notice */}
      {isZeroCostOrder && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-300 font-semibold text-center">
            🎉 Đơn hàng của bạn được miễn phí hoàn toàn!
          </p>
          <p className="text-green-200/80 text-sm text-center mt-1">
            Voucher đã được áp dụng. Nhấn xác nhận để hoàn tất đặt vé.
          </p>
        </div>
      )}

      {/* Payment methods - hide for zero-cost orders */}
      {!isZeroCostOrder && (
        <div className="space-y-4">
          {paymentMethods.map((payment) => (
            <div
              key={payment.method}
              onClick={() => handleSelect(payment)}
              className={cn(
                'flex items-center p-3 border rounded-lg border-slate-500/20 cursor-pointer bg-slate-500/10 text-neutral-400 ',
                selectedMethod === payment.method && 'bg-primary text-white',
                selectedMethod !== payment.method && 'hover:bg-slate-500/20'
              )}
            >
              {/* Icon */}
              <div className="rounded mr-3 flex items-center justify-center text-sm font-bold">
                <Image
                  src={payment.logo}
                  alt={payment.method}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
              <span className="font-medium">{payment.method}</span>
            </div>
          ))}
        </div>
      )}

      {/* Voucher input */}
      <div className="space-y-2">
        <p className="font-semibold text-lg">Mã giảm giá</p>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Nhập mã voucher"
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
          />
          <Button
            disabled={isPending || voucher.trim() === ''}
            onClick={() => handleValidatePromotion(voucher)}
          >
            Áp dụng
          </Button>
        </div>
      </div>

      {/* Payment button */}
      <Button
        onClick={handlePay}
        disabled={!pendingPaymentUrl && !isZeroCostOrder && !selectedMethod}
        className="w-full"
      >
        {isZeroCostOrder ? 'Xác nhận đặt vé' : 'Thanh toán'}
      </Button>
    </div>
  );
};
