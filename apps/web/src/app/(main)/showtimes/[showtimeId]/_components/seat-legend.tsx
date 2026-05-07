import { SeatTypeEnum } from '@/libs/types/showtime.type';
import { Accessibility, Star } from 'lucide-react';

const seatLegendItems = [
  // --- Trạng thái (Status) ---
  {
    label: 'Đã chọn',
    color:
      'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)] border-yellow-300',
    type: 'SELECTED',
  },
  {
    label: 'Đã đặt',
    color: 'bg-red-600 border-red-500',
    type: 'CONFIRMED',
  },
  {
    label: 'Đang giữ',
    color: 'bg-orange-500/50 border border-orange-400 animate-pulse',
    type: 'HELD',
  },
  {
    label: 'Hỏng',
    color: 'bg-gray-700 border-gray-600',
    type: 'BROKEN',
  },

  // --- Loại ghế (Seat Types) - Synced with Seat.tsx ---
  {
    label: 'Thường',
    color: 'bg-card border border-white/10 text-muted-foreground',
    type: SeatTypeEnum.STANDARD,
  },
  {
    label: 'VIP',
    color: 'bg-card border border-purple-400/60 text-purple-400',
    icon: Star,
    type: SeatTypeEnum.VIP,
  },
  {
    label: 'Cao cấp',
    color: 'bg-card border border-violet-400/60 text-violet-400',
    type: SeatTypeEnum.PREMIUM,
  },
  {
    label: 'Xe lăn',
    color:
      'bg-card border border-fuchsia-400/60 text-fuchsia-400 flex items-center justify-center',
    icon: Accessibility,
    type: SeatTypeEnum.WHEELCHAIR,
  },
  {
    label: 'Đôi',
    color: 'bg-card border border-pink-500/60 text-pink-400',
    type: SeatTypeEnum.COUPLE,
    isCouple: true,
  },
];

export const SeatLegend = () => (
  <div className="flex flex-wrap gap-4 mt-8 text-white justify-center">
    {seatLegendItems.map((item) => (
      <div key={item.label} className="flex items-center gap-2">
        {/* Couple Seat */}
        {item.isCouple ? (
          <div className={`h-5 w-10 rounded border ${item.color}`} />
        ) : (
          <div
            className={`h-5 w-5 rounded flex items-center justify-center border ${item.color}`}
          >
            {/* icon if available */}
            {item.icon && (
              <item.icon className="w-3 h-3 text-current opacity-70" />
            )}
          </div>
        )}

        <span className="text-sm text-gray-300">{item.label}</span>
      </div>
    ))}
  </div>
);
