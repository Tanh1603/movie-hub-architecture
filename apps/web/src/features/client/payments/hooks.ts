import { clientQueryKeys } from '@/features/client/shared/query-keys';
import { CreatePaymentDto } from "@movie-hub/shared-types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPayment } from "@/api/services";
import { useBookingStore } from "@/stores/booking-store";

export const useCreatePayment = () => {
  const { resetBooking} = useBookingStore();
  return useMutation({
    mutationKey: ['create-payment'],
    mutationFn: async ({
      bookingId,
      data
    }: {
      bookingId: string;
      data: CreatePaymentDto
    }) => {
      return await createPayment(bookingId, data);
    },
    onSuccess: (result) => {

      resetBooking();
    },
    onError: (error) => {
      toast.error(error?.message || 'Đã có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    }
  })
}