'use client';

import { Button } from '@movie-hub/shacdn-ui/button';
import { SeatTypeEnum } from '@/libs/types/showtime.type';
import { Accessibility, Star, Armchair } from 'lucide-react';

interface SeatProps {
  number: number;
  seatId: string;
  type: SeatTypeEnum;
  isSelected: boolean;
  isConfirmed?: boolean;
  isDisabled?: boolean;
  isHeld?: boolean;
  onClick: (seatId: string) => void;
}

export const Seat = ({
  number,
  seatId,
  type,
  isSelected,
  isConfirmed,
  isDisabled,
  isHeld,
  onClick,
}: SeatProps) => {
  // Base: Glassmorphic, subtle border, transition
  const baseClass =
    'relative flex items-center justify-center transition-all duration-200 p-0 rounded-md border shadow-sm hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary/20';

  // Default State Colors (Available)
  let stateClass =
    'bg-card border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10';
  let iconClass = 'w-3 h-3 md:w-4 md:h-4 opacity-70';

  // Active States overrides
  if (isSelected) {
    // Striking yellow for selected seats
    stateClass =
      'bg-yellow-400 border-yellow-300 text-black shadow-[0_0_20px_5px_rgba(250,204,21,0.6)] z-10 scale-110';
    iconClass = 'w-3 h-3 md:w-4 md:h-4 opacity-100';
  } else if (isConfirmed) {
    // Red for booked/confirmed seats
    stateClass =
      'bg-red-600 border-red-500 text-red-200 cursor-not-allowed hover:scale-100 shadow-none';
  } else if (isDisabled) {
    stateClass =
      'bg-secondary/30 border-transparent opacity-20 cursor-not-allowed hover:scale-100';
  } else if (isHeld) {
    // Orange-ish for held seats to differentiate from selected
    stateClass =
      'bg-orange-500/30 border-orange-400 text-orange-400 animate-pulse cursor-not-allowed';
  }

  // Type-specific sizing and styling
  let sizeClass =
    'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[10px] sm:text-xs font-medium';
  let content = <span className={isSelected ? 'font-bold' : ''}>{number}</span>;

  switch (type) {
    case SeatTypeEnum.STANDARD:
      // Standard is default
      break;

    case SeatTypeEnum.VIP:
      // Purple accent for VIP if not selected
      if (!isSelected && !isConfirmed && !isDisabled) {
        stateClass +=
          ' border-purple-400/60 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400';
      }
      content = (
        <Star
          className={iconClass}
          fill={isSelected ? 'currentColor' : 'none'}
        />
      );
      break;

    case SeatTypeEnum.PREMIUM:
      if (!isSelected && !isConfirmed && !isDisabled) {
        stateClass +=
          ' border-violet-400/60 text-violet-400 hover:bg-violet-500/10 hover:border-violet-400';
      }
      break;

    case SeatTypeEnum.WHEELCHAIR:
      if (!isSelected && !isConfirmed && !isDisabled) {
        stateClass +=
          ' border-fuchsia-400/60 text-fuchsia-400 hover:bg-fuchsia-500/10 hover:border-fuchsia-400';
      }
      content = <Accessibility className={iconClass} />;
      break;

    case SeatTypeEnum.COUPLE:
      sizeClass = 'w-12 h-6 sm:w-16 sm:h-8 md:w-20 md:h-10'; // Double width
      if (!isSelected && !isConfirmed && !isDisabled) {
        stateClass +=
          ' border-pink-500/60 text-pink-400 hover:bg-pink-500/10 hover:border-pink-500';
      }
      content = (
        <div className="flex items-center gap-1">
          <Armchair className={iconClass} />
          <span className="text-[10px] font-bold">{number}</span>
        </div>
      );
      break;
  }

  return (
    <Button
      onClick={() => onClick(seatId)}
      className={`${baseClass} ${sizeClass} ${stateClass}`}
      disabled={isDisabled || isHeld || isConfirmed}
      variant="ghost" // Override shadcn default solid
    >
      {content}
    </Button>
  );
};
