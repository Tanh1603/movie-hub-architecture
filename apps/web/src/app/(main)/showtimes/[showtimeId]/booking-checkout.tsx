import { ShowtimeSeatResponse } from '@/types/showtime.type';
import { PaymentSection } from './_components/payment';
import TicketPreview from './_components/ticket-preview';

export const BookingCheckout = ({data}: {data?: ShowtimeSeatResponse}) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white tracking-tight text-center">
        Thông tin thanh toán
      </h1>
      <div className="flex max-sm:flex-col gap-8 items-center justify-center">
        <PaymentSection />
        <TicketPreview data={data} />
      </div>
    </div>
  );
};
