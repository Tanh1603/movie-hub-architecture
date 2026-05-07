'use client';
import { ErrorFallback } from '@/components/error-fallback';
import { Loader } from '@/components/loader';
import { useGetBookings } from '@/hooks/booking-hooks';
import { BookingStatus } from '@/libs/types/booking.type';
import { useState } from 'react';
import BookingCard from './_components/booking-summary-card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@movie-hub/shacdn-ui/pagination';

export const MyBookingList = ({ status }: { status?: BookingStatus }) => {
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    isError,
    error,
  } = useGetBookings({ status, page });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-full ">
        <Loader size={32} />
      </div>
    );
  if (isError) return <ErrorFallback message={error.message} />;

  const totalPages = result?.meta?.totalPages || 0;

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* List */}
      {result?.data
        .filter((b) => b.status !== BookingStatus.PENDING)
        .map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}

      {/* Pagination */}
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && setPage(page - 1)}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {/* Số trang */}
          {Array.from({ length: totalPages }, (_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink
                isActive={page === idx + 1}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          {totalPages > 5 && <PaginationEllipsis />}

          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && setPage(page + 1)}
              className={
                page >= totalPages ? 'pointer-events-none opacity-50' : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
