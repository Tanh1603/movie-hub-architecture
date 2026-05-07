'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { useUser } from '@clerk/nextjs';
import { useFindPromotionByTypes } from '@/hooks/promotion-hook';
import { PromotionType } from '@/libs/types/promotion.type';
import { useState } from 'react';
import { PromotionCard } from './_components/promotion-card';

export const PromotionList = () => {
  const [type, setType] = useState<PromotionType | 'ALL'>('ALL');

  const { user } = useUser();

  const { data, isLoading } = useFindPromotionByTypes(
    type === 'ALL' ? undefined : type
  );

  const promotions = (data || []).filter((p) => {
    // If it's a refund voucher (checked via conditions), only show to owner
    if (p.conditions?.isRefundVoucher) {
      if (!user) return false;
      return p.conditions.userId === user.id;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white tracking-tight text-center">
        Khuyến mãi
      </h1>

      {/* Select category */}
      <Select
        value={type}
        onValueChange={(val) => setType(val as PromotionType | 'ALL')}
      >
        <SelectTrigger className="w-[220px] bg-zinc-900 text-white border-zinc-700">
          <SelectValue placeholder="Chọn loại" />
        </SelectTrigger>

        <SelectContent className="bg-zinc-900 text-white border-zinc-700">
          <SelectItem value="ALL">🎁 Tất cả</SelectItem>
          <SelectItem value={PromotionType.FIXED_AMOUNT}>
            💵 Giảm tiền cố định
          </SelectItem>
          <SelectItem value={PromotionType.FREE_ITEM}>
            🆓 Miễn phí sản phẩm
          </SelectItem>
          <SelectItem value={PromotionType.PERCENTAGE}>
            💰 Giảm theo %
          </SelectItem>
          <SelectItem value={PromotionType.POINTS}>🌟 Điểm thưởng</SelectItem>
        </SelectContent>
      </Select>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <PromotionCard.Skeleton key={idx} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && promotions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <div className="text-6xl mb-4">🧐</div>
          <p className="text-lg">Hiện tại không có khuyến mãi nào.</p>
        </div>
      )}

      {/* Food grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {!isLoading &&
          promotions.length > 0 &&
          promotions.map((promotion) => (
            <PromotionCard key={promotion.id} data={promotion} />
          ))}
      </div>
    </div>
  );
};
