import { clientQueryKeys } from '@/features/client/shared/query-keys';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  findAllPromotions,
  validatePromotion,
} from '@/api/services';
import { useBookingStore } from '@/stores/booking-store';
import {
  PromotionType,
  ValidatePromotionDto,
} from '@/types/promotion.type';

export const useValidationPromotion = () => {
  const { setPromotionCode } = useBookingStore();
  return useMutation({
    mutationKey: ['validate-promotion'],
    mutationFn: async ({
      code,
      validateDto,
    }: {
      code: string;
      validateDto: ValidatePromotionDto;
    }) => {
      return await validatePromotion(code, validateDto);
    },
    onSuccess: (result) => {
      const promotion = result.data;
      if (promotion.valid && promotion.promotion) {
        toast.success('Mã khuyến mãi hợp lệ và đã được áp dụng!');
        setPromotionCode(promotion.promotion?.code, promotion.promotion?.value);
      } else {
        toast.error(promotion.message || 'Mã khuyến mãi không hợp lệ.');
        setPromotionCode(null, 0);
      }
    },
  });
};

export const useFindPromotionByTypes = (type?: PromotionType) => {
  return useQuery({
    queryKey: clientQueryKeys.promotions.list(type),
    queryFn: async () => {
      const response = await findAllPromotions('true', type);
      return response.data;
    },
  });
};


