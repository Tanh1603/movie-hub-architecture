import { clientQueryKeys } from '@/features/client/shared/query-keys';
import {
  CreateBookingDto,
  UpdateBookingDto,
} from '@movie-hub/shared-types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  checkUserBookingAtShowtime,
  createBooking,
  getBookingDetails,
  getUserBookings,
  updateBooking,
} from '@/api/services';
import { getQueryClient } from '@/shared/query/get-query-client';
import { BookingStatus } from '@/types/booking.type';
import { useBookingStore } from '@/stores/booking-store';

export const useCreateBooking = () => {
  const { setBookingId } = useBookingStore();
  const queryClient = getQueryClient();
  return useMutation({
    mutationKey: ['create-booking'],
    mutationFn: async (data: CreateBookingDto) => {
      return await createBooking(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setBookingId(result.data.bookingId);
    },
    onError: (error) => {
          toast.error(
            error?.message ||
              'Đã có lỗi xảy ra khi tạo đặt vé. Vui lòng thử lại.'
          );
    },
  });
};

interface UseGetBookingsProps {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export const useGetBookings = ({ status, page = 1 }: UseGetBookingsProps) => {
  return useQuery({
    queryKey: clientQueryKeys.bookings.list(status, page),
    queryFn: async () => {
      const data = await getUserBookings(status, { page });
      return data;
    },
    staleTime: 1000 * 60,
  });
};

export const useGetBookingById = (bookingId: string) => {
  return useQuery({
    queryKey: clientQueryKeys.bookings.detail(bookingId),
    queryFn: async () => {
      const response = await getBookingDetails(bookingId);
      return response.data;
    },
    enabled: !!bookingId,
    staleTime: 1000 * 60,
  });
};

export const useCheckUserBookingAtShowtime = (showtimeId: string) => {
  const { setBookingId } = useBookingStore();
  return useQuery({
    queryKey: clientQueryKeys.bookings.byShowtime(showtimeId),
    queryFn: async () => {
      const response = await checkUserBookingAtShowtime(showtimeId);
      if (response.data) {
        setBookingId(response.data.bookingId);
      }
      return response;
    },
    enabled: !!showtimeId,
  });
};

export const useUpdateBooking = () => {
  return useMutation({
    mutationKey: ['update-booking'],
    mutationFn: async ({
      bookingId,
      data,
    }: {
      bookingId: string;
      data: UpdateBookingDto;
    }) => {
      return await updateBooking(bookingId, data);
    },
    onSuccess: () => {
      const queryClient = getQueryClient();
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (error) => {
          toast.error(
            error?.message ||
              'Đã có lỗi xảy ra khi cập nhật đặt vé. Vui lòng thử lại.'
          );
    },
  });
};
