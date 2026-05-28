import {
  LayoutTypeEnum,
  ReservationStatusEnum,
  SeatRowDto
} from '@/types/showtime.type';
import { seatLayouts } from './layout-render';


interface SeatGridProps {
  layoutType: LayoutTypeEnum;
  seatMap: SeatRowDto[]; // Dữ liệu từ BE
  selectedSeats: string[]; // Danh sách seatLabel (vd: A5, B10)
  seatReservationStatus: Record<string, ReservationStatusEnum>; // key = seatLabel
  seatHeldByUser: Record<string, boolean>; // key = seatLabel
  onSeatClick: (seatLabel: string) => void; // callback theo label
}

export const SeatGrid = ({
  layoutType = LayoutTypeEnum.STADIUM,
  seatMap,
  selectedSeats,
  seatReservationStatus,
  seatHeldByUser,
  onSeatClick,
}: SeatGridProps) => {
  if (!seatMap || seatMap.length === 0) return null;
  const renderLayout = seatLayouts[layoutType];

  return (
    <div className="flex flex-col items-center mt-10 space-y-4">
      {seatMap.map((row, idx) =>
        renderLayout({
          rowData: row,
          rowIndex: idx,
          selectedSeats,
          seatReservationStatus,
          seatHeldByUser,
          onSeatClick,
        })
      )}
    </div>
  );
};
