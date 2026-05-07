'use client';

import { SeatTypeEnum } from '@/libs/types/showtime.type';
import React from 'react';
import { Accessibility, Star } from 'lucide-react';

export type TicketType = {
  key: SeatTypeEnum;
  label: string;
  price: number;
};

type TicketTypeListProps = {
  tickets: TicketType[];
};

export const TicketTypeList: React.FC<TicketTypeListProps> = ({ tickets }) => {
  const getStyle = (type: SeatTypeEnum) => {
    switch (type) {
      case SeatTypeEnum.VIP:
        return {
          wrapper: 'bg-card border-purple-400/60',
          text: 'text-purple-400',
          icon: <Star className="w-5 h-5 text-purple-400" />,
        };
      case SeatTypeEnum.PREMIUM:
        return {
          wrapper: 'bg-card border-violet-400/60',
          text: 'text-violet-400',
          icon: null,
        };
      case SeatTypeEnum.WHEELCHAIR:
        return {
          wrapper: 'bg-card border-fuchsia-400/60',
          text: 'text-fuchsia-400',
          icon: <Accessibility className="w-5 h-5 text-fuchsia-400" />,
        };
      case SeatTypeEnum.COUPLE:
        return {
          wrapper: 'bg-card border-pink-500/60',
          text: 'text-pink-400',
          icon: null,
        };
      default: // STANDARD
        return {
          wrapper: 'bg-card border-white/10',
          text: 'text-gray-300',
          icon: null,
        };
    }
  };

  return (
    <div className="w-full mt-10 text-white flex flex-col gap-4 items-center justify-center">
      <h2 className="text-xl font-semibold mb-4 text-center">Giá vé</h2>

      <div className="flex flex-row flex-wrap gap-6 items-center justify-center">
        {tickets.map((ticket) => {
          const style = getStyle(ticket.key);
          return (
            <div
              key={ticket.key}
              className={`flex flex-col justify-between items-center p-4 rounded-xl gap-2 min-w-[120px] border shadow-sm transition-transform hover:scale-105 ${style.wrapper}`}
            >
              <div className="flex items-center gap-2">
                {style.icon}
                <p
                  className={`font-medium uppercase tracking-wide ${style.text}`}
                >
                  {ticket.label}
                </p>
              </div>
              <p className="text-lg font-bold text-white">
                {ticket.price.toLocaleString()} đ
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
