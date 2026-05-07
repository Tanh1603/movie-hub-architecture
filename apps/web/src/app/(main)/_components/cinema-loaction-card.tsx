import { CinemaLocationResponse } from '@/libs/types/cinema.type';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Card, CardContent } from '@movie-hub/shacdn-ui/card';

import { MapPin, Star } from 'lucide-react';
import Image from 'next/image';

export function CinemaLocationCard({
  cinema,
  onSelect,
}: {
  cinema: CinemaLocationResponse;
  onSelect: (cinemaId: string) => void;
}) {
  return (
    <Card
      className="
        w-full cursor-pointer
        rounded-2xl border border-primary/20
        bg-black/70
        shadow-md shadow-primary/10
        transition-all
        hover:-translate-y-1
        hover:border-primary/60
        hover:shadow-lg hover:shadow-primary/30
        p-4
      "
      onClick={() => onSelect(cinema.id)}
    >
      <CardContent className="p-0 flex flex-col gap-3">
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-primary/20 bg-primary/10">
          <Image
            src={cinema.images?.[0] || '/images/placeholder-bg.png'}
            alt={cinema.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-white text-base font-semibold truncate">
            {cinema.name}
          </h3>

          <div className="flex items-center text-xs text-primary/80">
            <MapPin className="w-4 h-4 mr-1 text-primary" />
            {cinema.location?.distanceText || 'Khoảng cách chưa xác định'}
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span className="text-amber-200">
              {cinema.rating ? cinema.rating.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] text-gray-400 ml-1">
              ({cinema.totalReviews})
            </span>
          </div>
        </div>

        <Button
          className="
            w-full mt-2 rounded-xl
            bg-primary hover:bg-primary/90
            text-white
            border-none
          "
        >
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  );
}

CinemaLocationCard.Skeleton = function CinemaLocationCardSkeleton() {
  return (
    <Card
      className="
        w-full rounded-2xl p-4
        bg-black/70
        border border-primary/20
        shadow-md shadow-primary/10
        animate-pulse
      "
    >
      <CardContent className="p-0 flex flex-col gap-3">
        <div className="w-full h-40 rounded-xl bg-primary/10" />

        <div className="flex flex-col gap-2">
          <div className="h-5 w-3/4 bg-primary/15 rounded" />
          <div className="h-4 w-1/2 bg-primary/10 rounded" />
          <div className="h-4 w-1/3 bg-primary/10 rounded" />
        </div>

        <div className="h-10 w-full bg-primary/15 rounded-xl mt-2" />
      </CardContent>
    </Card>
  );
};
