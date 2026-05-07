'use client';

import { useMemo } from 'react';
import { getVietnameseDay } from '../app/utils/get-vietnamese-day';

type SelectedDateKey = string; // dạng 'YYYY-MM-DD'

interface DateSelect7DaysProps {
  selected: SelectedDateKey;
  onSelect: (value: SelectedDateKey) => void;
}

export const DateSelect7Days = ({
  selected,
  onSelect,
}: DateSelect7DaysProps) => {
  const next7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split('T')[0]; // format YYYY-MM-DD
    });
  }, []);

  return (
    <div className="w-full">
      {/* Section Title with gradient accent */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-purple-500 via-fuchsia-500 to-pink-500 rounded-full" />
        <h3 className="text-xl font-bold text-white tracking-wide">
          Chọn ngày
        </h3>
      </div>

      {/* Date buttons container with glassmorphism */}
      <div className="relative p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />

        <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {next7Days.map((date, index) => {
            const isSelected = selected === date;
            const isToday = index === 0;

            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                className={`
                  group relative flex h-[90px] w-full flex-col items-center justify-center rounded-xl
                  transition-all duration-300 ease-out
                  ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-500/30 scale-105 z-10'
                      : 'bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 hover:border-purple-400/50 hover:scale-[1.02]'
                  }
                `}
              >
                {/* Glow effect for selected */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 via-transparent to-pink-400/20 blur-xl -z-10" />
                )}

                {/* Today indicator */}
                {isToday && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                )}

                {/* Date number */}
                <span
                  className={`
                  text-lg font-bold tracking-tight
                  ${
                    isSelected
                      ? 'text-white drop-shadow-lg'
                      : 'text-white group-hover:text-purple-300 transition-colors'
                  }
                `}
                >
                  {new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>

                {/* Day name */}
                <span
                  className={`
                  text-xs font-medium mt-1
                  ${
                    isSelected
                      ? 'text-white/90'
                      : 'text-slate-400 group-hover:text-purple-300/80 transition-colors'
                  }
                `}
                >
                  {getVietnameseDay(date)}
                </span>

                {/* Hover shimmer effect */}
                <div
                  className={`
                  absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
                  bg-gradient-to-r from-transparent via-white/5 to-transparent
                  transition-opacity duration-500
                  ${isSelected ? 'hidden' : ''}
                `}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
