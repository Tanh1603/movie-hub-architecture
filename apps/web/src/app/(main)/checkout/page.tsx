import Link from 'next/link';
import { Button } from '@movie-hub/shacdn-ui/button';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const hasParams = Object.keys(params).length > 0;

  if (hasParams) {
    const vnpRef = params.vnp_TxnRef;
    const bookingIdParam = params.bookingId;

    const refId = Array.isArray(vnpRef) ? vnpRef[0] : vnpRef;
    const bId = Array.isArray(bookingIdParam)
      ? bookingIdParam[0]
      : bookingIdParam;

    // ID to display (Booking ID or Transaction Ref)
    const displayId = bId || refId;

    // Check success status
    // 1. Zero-amount flow: success=true
    // 2. VNPay flow: vnp_ResponseCode=00
    const isFailure =
      params.success === 'false' ||
      (params.vnp_ResponseCode && params.vnp_ResponseCode !== '00');

    if (isFailure) {
      return (
        <div className="flex flex-col gap-8 w-full text-center items-center justify-center text-white">
          <h1 className="text-3xl font-bold text-red-500">
            Thanh toán thất bại
          </h1>
          {displayId && <p>Mã giao dịch: {displayId}</p>}
          <p>Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="outline">Về trang chủ</Button>
            </Link>
            {bId && (
              <Link href={`/my-booking`}>
                <Button>Quay lại Đặt vé</Button>
              </Link>
            )}
          </div>
        </div>
      );
    }

    // Default to success if not explicitly failed (backward compatibility or assume success flow)
    return (
      <div className="flex flex-col gap-8 w-full items-center text-center">
        <h1 className="text-3xl font-bold text-green-500">
          Thanh toán thành công
        </h1>

        {displayId && <p className="text-white">Mã giao dịch: {displayId}</p>}

        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button>Về trang chủ</Button>
          </Link>

          {/* If we have a booking ID (either direct or we treat txnRef as one), 
              we can link to my-booking via the button. 
              Ideally we should link to specific booking if known. 
          */}
          <Link href={`/my-booking`}>
            <Button variant="outline">Xem vé của tôi</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Không có params => giữ nguyên giao diện cũ
  return (
    <div className="flex flex-col gap-8 w-full text-center items-center justify-center text-white">
      <h1 className="text-3xl font-bold">Trang thanh toán</h1>
      <p>Không tìm thấy trạng thái giao dịch.</p>
      <Link href="/">
        <Button variant="outline">Về trang chủ</Button>
      </Link>
    </div>
  );
}
