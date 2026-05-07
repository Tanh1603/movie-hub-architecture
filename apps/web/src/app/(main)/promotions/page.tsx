import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { findAllPromotions } from '@/libs/actions/promotion/promotion-actions';
import { getQueryClient } from '@/libs/get-query-client';
import { PromotionType } from '@/libs/types/promotion.type';
import { PromotionList } from './promotion-list';

export default async function PromotionsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['promotions', PromotionType.FIXED_AMOUNT],
    queryFn: async () => {
      const response = await findAllPromotions(
        'true',
        PromotionType.FIXED_AMOUNT
      );
      return response.data;
    },
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full p-4">
        <PromotionList />
      </div>
    </HydrationBoundary>
  );
}
