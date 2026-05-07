import {
  BookingCalculationDto,
  BookingSummaryDto,
  CreateBookingDto,
  PaginationQuery,
  ServiceResult,
  UpdateBookingDto,
} from '@movie-hub/shared-types';
import api from '../../api-client';
import { BookingDetailDto, BookingStatus } from '../../types/booking.type';

export const createBooking = async (
  createBookingDto: CreateBookingDto
): Promise<ServiceResult<BookingCalculationDto>> => {
  try {
    const response = await api.post('/bookings', createBookingDto);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBooking = async (
  bookingId: string,
  dto: UpdateBookingDto
) => {
  try {
    const response = await api.put(`/bookings/${bookingId}`, dto);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserBookings = async (
  status: BookingStatus | undefined,
  pagination: PaginationQuery
): Promise<ServiceResult<BookingSummaryDto[]>> => {
  try {
    const response = await api.get('/bookings', {
      params: {
        status,
        ...pagination,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBookingDetails = async (
  bookingId: string
): Promise<ServiceResult<BookingDetailDto>> => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelBooking = async (bookingId: string, reason?: string) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/cancel`, {
      reason,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkUserBookingAtShowtime = async (
  showtimeId: string,
  includeStatuses?: string
): Promise<ServiceResult<BookingCalculationDto | null>> => {
  try {
    const response = await api.get(`/bookings/showtime/${showtimeId}/check`, {
      params: {
        includeStatuses,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
