import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton';
import { PromotionDto } from '@/libs/types/promotion.type';

import { CalendarDays, TicketPercent } from 'lucide-react';

export const PromotionCard = ({ data }: { data: PromotionDto }) => {
  const isRefund = data.conditions?.isRefundVoucher;

  return (
    <Card
      className={`w-full max-w-md rounded-2xl shadow-lg p-4 transition-colors ${
        isRefund
          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500'
          : 'bg-slate-200/5 border-slate-200/10 hover:border-primary/50'
      }`}
    >
      <CardHeader>
        <CardTitle
          className={`text-xl font-bold flex items-center gap-2 ${
            isRefund ? 'text-amber-500' : 'text-primary'
          }`}
        >
          <TicketPercent className="w-5 h-5" /> {data.name}
        </CardTitle>
        <div className="text-sm text-neutral-300 break-all">
          Mã: <span className="font-mono text-white">{data.code}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {data.description && (
          <div className="text-gray-400 text-sm">{data.description}</div>
        )}

        <div className="flex flex-wrap gap-2">
          {isRefund ? (
            <Badge className="bg-amber-600 hover:bg-amber-700">Hoàn tiền</Badge>
          ) : (
            <Badge variant="secondary">{data.type}</Badge>
          )}
          <Badge variant="destructive">
            Giá trị: {new Intl.NumberFormat('vi-VN').format(data.value)} đ
          </Badge>
          {data.maxDiscount && (
            <Badge variant="secondary">
              Tối đa: {new Intl.NumberFormat('vi-VN').format(data.maxDiscount)}{' '}
              đ
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-400 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          {new Date(data.validFrom).toLocaleDateString()} →{' '}
          {new Date(data.validTo).toLocaleDateString()}
        </div>

        <div className="text-sm text-gray-400">
          Áp dụng cho:{' '}
          {isRefund
            ? 'Toàn bộ hệ thống'
            : data.applicableFor
                .map((item) => (item === 'tickets' ? 'Vé phim' : item))
                .join(', ')}
        </div>

        <div className="text-sm text-neutral-300">
          Đã dùng: {data.currentUsage}
          {data.usageLimit && ` / ${data.usageLimit}`}
        </div>
      </CardContent>
    </Card>
  );
};

PromotionCard.Skeleton = function PromotionCardSkeleton() {
  return (
    <Card className="w-full max-w-md rounded-2xl bg-neutral-700 shadow-lg p-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-32 h-6" />
        </CardTitle>
        <div className="text-sm text-neutral-300">
          <Skeleton className="w-24 h-4" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4 mt-1" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="w-16 h-6" />
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-24 h-6" />
        </div>

        <div className="text-sm text-gray-400 flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-32 h-4" />
        </div>

        <div className="text-sm text-gray-400">
          <Skeleton className="w-40 h-4" />
        </div>

        <div className="text-sm text-neutral-300">
          <Skeleton className="w-20 h-4" />
        </div>
      </CardContent>
    </Card>
  );
};
