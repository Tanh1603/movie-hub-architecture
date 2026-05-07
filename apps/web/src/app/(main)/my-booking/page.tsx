import { MyBookingList } from './my-booking-list';
import { RequireSignIn } from '@/components/require-sign-in';

export default function MyBookingPage() {
  return (
    <RequireSignIn>
      <div className="w-full h-full flex flex-col items-center text-white p-4 gap-4">
        <h1 className="text-3xl font-bold">Đặt vé của tôi</h1>
        <MyBookingList />
      </div>
    </RequireSignIn>
  );
}
