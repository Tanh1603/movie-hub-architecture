  import {
    ReservationStatusEnum,
    SeatRowDto,
    SeatStatusEnum,
    SeatTypeEnum
  } from '@/types/showtime.type';
  import { Seat } from './seat';

  export interface LayoutRenderProps {
    rowData: SeatRowDto;
    rowIndex: number;
    selectedSeats: string[];
    seatReservationStatus: Record<string, ReservationStatusEnum>;
    seatHeldByUser: Record<string, boolean>;
    onSeatClick: (seatLabel: string) => void;
  }

  // 🔹 renderSeats chung, support COUPLE
 const renderSeats = ({
   rowData,
   selectedSeats,
   seatReservationStatus,
   seatHeldByUser,
   onSeatClick,
 }: LayoutRenderProps) => {
   const seats = [];
   let i = 0;

   while (i < rowData.seats.length) {
     const seat = rowData.seats[i];
     const label = `${rowData.row}${seat.number}`;

     const isSelected = selectedSeats.includes(label);
     const reservationStatus = seatReservationStatus[label];
     const isDisabled = seat.seatStatus !== SeatStatusEnum.ACTIVE;
     const isConfirmed = reservationStatus === ReservationStatusEnum.CONFIRMED;
     const isHeldByOther =
       reservationStatus === ReservationStatusEnum.HELD &&
       !seatHeldByUser[label];

     // 🔸 GHẾ COUPLE (Xử lý 2 ghế liền nhau)
     if (seat.seatType === SeatTypeEnum.COUPLE) {
       const nextSeat = rowData.seats[i + 1];
       const coupleLabel = nextSeat
         ? `${rowData.row}${nextSeat.number}`
         : label;

       seats.push(
         <Seat
           key={label}
           seatId={seat.id}
           number={seat.number}
           type={SeatTypeEnum.COUPLE}
           isSelected={isSelected || selectedSeats.includes(coupleLabel)}
           isDisabled={isDisabled || !nextSeat}
           isConfirmed={isConfirmed}
           isHeld={isHeldByOther}
           onClick={() => onSeatClick(label)}
         />
       );

       i += 2;
       continue;
     }

     // 🔸 GHẾ PREMIUM (ghế VIP, logic như standard)
     if (seat.seatType === SeatTypeEnum.PREMIUM) {
       seats.push(
         <Seat
           key={label}
           seatId={seat.id}
           number={seat.number}
           type={SeatTypeEnum.PREMIUM}
           isSelected={isSelected}
           isDisabled={isDisabled}
           isConfirmed={isConfirmed}
           isHeld={isHeldByOther}
           onClick={() => onSeatClick(label)}
         />
       );

       i += 1;
       continue;
     }

     // 🔸 GHẾ WHEELCHAIR (ghế xe lăn)
     if (seat.seatType === SeatTypeEnum.WHEELCHAIR) {
       seats.push(
         <Seat
           key={label}
           seatId={seat.id}
           number={seat.number}
           type={SeatTypeEnum.WHEELCHAIR}
           isSelected={isSelected}
           isDisabled={isDisabled} // wheelchair có thể disable từ BE
           isConfirmed={isConfirmed}
           isHeld={isHeldByOther}
           onClick={() => onSeatClick(label)}
         />
       );

       i += 1;
       continue;
     }

     // 🔸 GHẾ STANDARD
     seats.push(
       <Seat
         key={label}
         seatId={seat.id}
         number={seat.number}
         type={seat.seatType}
         isSelected={isSelected}
         isDisabled={isDisabled}
         isConfirmed={isConfirmed}
         isHeld={isHeldByOther}
         onClick={() => onSeatClick(label)}
       />
     );

     i += 1;
   }

   return seats;
 };


  // Layout functions
  export const standardLayout = (props: LayoutRenderProps) => (
    <div
      key={props.rowData.row}
      className="flex gap-2 items-center justify-start overflow"
    >
      <div className="w-6 text-right text-gray-400 font-semibold">
        {props.rowData.row}
      </div>
      {renderSeats(props)}
    </div>
  );

  export const dualAisleLayout = (props: LayoutRenderProps) => {
    const half = Math.ceil(props.rowData.seats.length / 2);
    return (
      <div
        key={props.rowData.row}
        className="flex justify-between w-full max-w-4xl px-8"
      >
        {standardLayout({
          ...props,
          rowData: {
            ...props.rowData,
            seats: props.rowData.seats.slice(0, half),
          },
        })}
        {standardLayout({
          ...props,
          rowData: { ...props.rowData, seats: props.rowData.seats.slice(half) },
        })}
      </div>
    );
  };

  export const stadiumLayout = (props: LayoutRenderProps) => (
    <div
      key={props.rowData.row}
      className="flex gap-2 items-center justify-center"
      style={{
        transform: `translateX(${
          (props.rowIndex - props.rowData.seats.length / 2) * 6
        }px)`,
      }}
    >
      <div className="w-6 text-right text-gray-400 font-semibold">
        {props.rowData.row}
      </div>
      {renderSeats(props)}
    </div>
  );

  export const seatLayouts: Record<
    string,
    (props: LayoutRenderProps & { rowIndex?: number }) => JSX.Element
  > = {
    STANDARD: standardLayout,
    DUAL_AISLE: dualAisleLayout,
    STADIUM: stadiumLayout,
  };
