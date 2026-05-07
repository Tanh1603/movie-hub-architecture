import { Star } from 'lucide-react';
import { cn } from '@movie-hub/shacdn-utils';
import { useState } from 'react';

interface StarRatingProps {
  max?: number;
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  max = 5,
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSize = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= (hoverValue || value);

        return (
          <button
            key={index}
            type="button"
            className={cn(
              'transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/50 rounded-sm',
              readOnly && 'cursor-default'
            )}
            onClick={() => !readOnly && onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            disabled={readOnly}
          >
            <Star
              className={cn(
                starSize[size],
                isActive
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                  : 'text-slate-600 fill-slate-800/50',
                !readOnly &&
                  'hover:scale-110 transition-transform cursor-pointer'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
