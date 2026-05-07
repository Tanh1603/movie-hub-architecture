'use client';

import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '@/libs/api/services';
import { ReviewForm } from './review-form';
import { StarRating } from '@/components/ui/star-rating';
import { formatDate } from 'date-fns';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@movie-hub/shacdn-ui/avatar';

interface MovieReviewsProps {
  movieId: string;
}

export function MovieReviews({ movieId }: MovieReviewsProps) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['movie-reviews', movieId],
    queryFn: async () => {
      const response = await moviesApi.getReviews(movieId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response as any).data || response;
    },
  });

  const reviewList = Array.isArray(reviews) ? reviews : [];

  // Calculate stats
  const totalReviews = reviewList.length;
  const averageRating =
    totalReviews > 0
      ? (
          reviewList.reduce(
            (acc: number, curr: any) => acc + (curr.rating || 0),
            0
          ) / totalReviews
        ).toFixed(1)
      : 0;

  return (
    <div className="mt-20 mb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-slate-200 to-purple-400 bg-clip-text text-transparent">
              Đánh Giá & Nhận Xét
            </span>
            <span className="text-lg font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
              {totalReviews}
            </span>
          </h2>
          <p className="text-slate-400 mt-2 text-lg">
            Chia sẻ suy nghĩ của bạn về bộ phim này
          </p>
        </div>

        {totalReviews > 0 && (
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-800 shadow-xl">
            <div className="text-center px-2">
              <span className="block text-4xl font-black text-white">
                {averageRating}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                trên 5
              </span>
            </div>
            <div className="h-10 w-px bg-slate-700 mx-2"></div>
            <div>
              <StarRating value={Number(averageRating)} readOnly size="md" />
              <p className="text-xs text-slate-400 mt-1 pl-1">
                Dựa trên {totalReviews} đánh giá
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-12 items-start">
        {/* Left Column: Reviews List */}
        <div className="lg:col-span-7 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-slate-900/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : reviewList.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reviewList.map((review: any) => (
              <div
                key={review.id}
                className="group bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border-2 border-slate-800 shadow-md">
                    {review.user?.imageUrl && (
                      <AvatarImage
                        src={review.user.imageUrl}
                        alt={review.user.fullName}
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                      {review.user?.fullName
                        ? review.user.fullName.substring(0, 1).toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-200 text-lg group-hover:text-primary transition-colors">
                        {review.user?.fullName || 'Người dùng'}
                      </h4>
                      <span className="text-sm text-slate-500 font-medium bg-slate-950/50 px-2 py-1 rounded">
                        {review.createdAt
                          ? formatDate(
                              new Date(review.createdAt),
                              'dd/MM/yyyy • HH:mm'
                            )
                          : ''}
                      </span>
                    </div>
                    <div className="mb-3">
                      <StarRating value={review.rating} readOnly size="sm" />
                    </div>
                    <p className="text-slate-300 leading-relaxed text-base break-words">
                      {review.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 text-center">
              <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                <div className="text-6xl">💬</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Chưa có đánh giá nào
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Hãy là người đầu tiên chia sẻ cảm nhận của bạn về bộ phim này. Ý
                kiến của bạn rất quan trọng!
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Review Form (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="relative">
            {/* Decorative gradient blur behind the form */}
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-purple-600 rounded-2xl blur opacity-10"></div>
            <ReviewForm
              movieId={movieId}
              reviews={reviewList}
              isCheckLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
