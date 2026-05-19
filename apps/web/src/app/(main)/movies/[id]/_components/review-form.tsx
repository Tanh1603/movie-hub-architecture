'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi } from '@/api/services';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Textarea } from '@movie-hub/shacdn-ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { CreateReviewRequest, Review } from '@/types';

interface ReviewFormProps {
  movieId: string;
  reviews?: Review[];
  isCheckLoading?: boolean;
  onSuccess?: () => void;
}

export function ReviewForm({
  movieId,
  reviews = [],
  isCheckLoading = false,
  onSuccess,
}: ReviewFormProps) {
  const { user, isSignedIn } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  const mutation = useMutation({
    mutationFn: (data: CreateReviewRequest) =>
      moviesApi.createReview(movieId, data),
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
      setRating(0);
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['movie-reviews', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movie-detail', movieId] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) {
      toast({ title: 'Please sign in to review', variant: 'destructive' });
      return;
    }
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    if (!content.trim()) {
      toast({ title: 'Please write a review', variant: 'destructive' });
      return;
    }

    mutation.mutate({
      movieId,
      userId: user.id,
      rating,
      content,
    });
  };

  const hasReviewed =
    isSignedIn && user && reviews?.some((review) => review.userId === user.id);

  if (isCheckLoading) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 text-center">
        <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Đã gửi đánh giá</h3>
        <p className="text-slate-400 max-w-xs mx-auto">
          Bạn đã đánh giá bộ phim này rồi. Cảm ơn bạn đã chia sẻ ý kiến!
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl text-center border border-slate-800 shadow-2xl relative z-10">
        <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔒</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Đăng nhập để đánh giá
        </h3>
        <p className="text-slate-400 mb-6 max-w-xs mx-auto">
          Bạn cần đăng nhập để chia sẻ cảm nhận của mình về bộ phim này.
        </p>
        <div id="clerk-captcha" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-slate-100">✍️</span> Viết đánh giá
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Xếp hạng của bạn
          </label>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-center">
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Nội dung đánh giá
          </label>
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bộ phim này thế nào? Diễn xuất ra sao? Hãy chia sẻ suy nghĩ chân thật nhất của bạn..."
              className="bg-slate-950/50 border-slate-800 text-slate-200 min-h-[150px] p-4 text-base placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all rounded-xl resize-none"
            />
            {content.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-medium">
                {content.length} ký tự
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending || rating === 0 || !content.trim()}
          className="w-full bg-gradient-to-r from-slate-200 to-slate-100 hover:from-white hover:to-slate-50 text-slate-900 font-bold py-6 rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi đánh giá'
          )}
        </Button>
      </form>
    </div>
  );
}
