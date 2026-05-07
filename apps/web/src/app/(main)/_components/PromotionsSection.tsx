'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@movie-hub/shacdn-ui/carousel';
import { useUser } from '@clerk/nextjs';
import { useFindPromotionByTypes } from '@/hooks/promotion-hook';
import { ArrowRight, TicketPercent } from 'lucide-react';
import Link from 'next/link';
import { PromotionCard } from '../promotions/_components/promotion-card';

export default function PromotionsSection() {
  const { data: promotionsData, isLoading } = useFindPromotionByTypes();

  const { user } = useUser();

  const promotions = (promotionsData || []).filter((p) => {
    if (p.conditions?.isRefundVoucher) {
      if (!user) return false;
      return p.conditions.userId === user.id;
    }
    return true;
  });

  return (
    <section className="px-6 w-full py-10 relative">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-2">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">
              Ưu Đãi Đặc Biệt
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider flex items-center gap-3">
              <TicketPercent className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              Khuyến Mãi
            </h2>
          </div>

          <Link
            href="/promotions"
            className="group flex items-center gap-2 text-base font-bold text-white bg-white/10 px-6 py-3 rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-wider"
          >
            Tất cả ưu đãi
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 pb-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <CarouselItem
                    key={i}
                    className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <PromotionCard.Skeleton />
                  </CarouselItem>
                ))
              : promotions?.map((promo) => (
                  <CarouselItem
                    key={promo.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <PromotionCard data={promo} />
                  </CarouselItem>
                ))}
            {!isLoading && (!promotions || promotions.length === 0) && (
              <div className="pl-4 w-full">
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-4xl mb-2">🎁</div>
                  <p className="text-sm">Hiện tại chưa có khuyến mãi mới.</p>
                </div>
              </div>
            )}
          </CarouselContent>
          <CarouselPrevious className="left-0 -translate-x-1/2 bg-black/50 border-white/10 text-white hover:bg-primary hover:border-primary disabled:opacity-0" />
          <CarouselNext className="right-0 translate-x-1/2 bg-black/50 border-white/10 text-white hover:bg-primary hover:border-primary disabled:opacity-0" />
        </Carousel>
      </div>
    </section>
  );
}
