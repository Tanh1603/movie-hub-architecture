import { CreatePaymentDto } from "@movie-hub/shared-types";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPayment } from "@/api/services";

export const useCreatePayment = () => {
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
    onError: (error) => {
      toast.error(error?.message || 'Đã có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    }
  })
}
