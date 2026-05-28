import {
  SeatBookingEvent,
  SeatEvent,
  UpdateBookingDto,
} from '@movie-hub/shared-types';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { create } from 'zustand';
import {
  ReservationStatusEnum,
  SeatRowDto,
  SeatTypeEnum,
  ShowtimeSeatResponse,
} from '@/types/showtime.type';

type SeatItem = {
  type: string;
  quantity: number;
  price: number;
};

type BookingState = {
  bookingId?: string;
  currentShowtimeId: string | null;
  selectedSeats: string[]; // row+number
  seatReservationStatus: Record<string, ReservationStatusEnum>;
  seatHeldByUser: Record<string, boolean>;
  seatMap: SeatRowDto[];
  tickets: { key: SeatTypeEnum; label: string; price: number }[];
  ticketCounts: Record<SeatTypeEnum, number>;
  maxTickets: number;
  holdTimeSeconds: number;
  socketConnected: boolean;

  // Map label <-> seatId để emit socket
  seatLabelToId: Record<string, string>;
  seatIdToLabel: Record<string, string>;

  connectSocket: (showtimeId: string, userId: string) => void;
  disconnectSocket: () => void;

  initBookingData: (data: ShowtimeSeatResponse) => void;
  toggleSeat: (seatLabel: string) => void;
  updateHoldTimeSeconds: (seconds: number) => void;
  resetBooking: () => void;

  totalTickets: number;
  totalTicketPrice: number;

  concessionSelections: Record<string, number>;
  concessionMap: Record<string, { name: string; price: number }>;
  totalConcessionPrice: number;

  promotionCode: string | null;
  discountAmount: number;

  // Actions
  setConcessionSelection: (
    id: string,
    qty: number,
    meta?: { name: string; price: number }
  ) => void;
  setPromotionCode: (code: string | null, amount: number) => void;

  // Build DTO for server
  buildBookingPayload: () => UpdateBookingDto;

  // Check if voucher exceeds bill (for warning display)
  getVoucherExcessAmount: () => number;

  // Build preview UI
  buildPreviewData: () => {
    seats: SeatItem[];
    concessions: Array<{ name: string; price: number; quantity: number }>;
    discountCode: string | null;
    discountAmount: number;
    total: number;
  };

  getTotalFinal: () => number;

  setBookingId: (id: string) => void;
};

let socket: Socket | null = null;

export const useBookingStore = create<BookingState>((set, get) => ({
  currentShowtimeId: null,
  selectedSeats: [],
  seatReservationStatus: {},
  seatHeldByUser: {},
  seatMap: [],
  tickets: [],
  ticketCounts: {} as Record<SeatTypeEnum, number>,
  maxTickets: 8,
  totalTicketPrice: 0,
  totalTickets: 0,
  holdTimeSeconds: 600,
  socketConnected: false,
  seatLabelToId: {},
  seatIdToLabel: {},
  bookingId: undefined,
  setBookingId: (id: string) => {
    set({ bookingId: id });
  },

  // ---------------- initBookingData ----------------
  initBookingData: (data: ShowtimeSeatResponse) => {
    const seatReservationStatus: Record<string, ReservationStatusEnum> = {};
    const seatHeldByUser: Record<string, boolean> = {};
    const selectedSeats: string[] = [];
    const seatLabelToId: Record<string, string> = {};
    const seatIdToLabel: Record<string, string> = {};

    const seatMap = data.seat_map.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => {
        const label = `${row.row}${seat.number}`;
        seatReservationStatus[label] = seat.reservationStatus;
        seatHeldByUser[label] = seat.isHeldByCurrentUser || false;
        if (seat.isHeldByCurrentUser) selectedSeats.push(label);
        seatLabelToId[label] = seat.id;
        seatIdToLabel[seat.id] = label;
        return { ...seat, label };
      }),
    }));

    const tickets = data.ticketPrices.map((type) => {
      const pricing = type.price;
      const label =
        type.seatType === SeatTypeEnum.STANDARD
          ? 'Ghế thường'
          : type.seatType === SeatTypeEnum.PREMIUM
          ? 'Ghế cao cấp'
          : type.seatType === SeatTypeEnum.VIP
          ? 'Ghế VIP'
          : type.seatType === SeatTypeEnum.COUPLE
          ? 'Ghế đôi'
          : 'Ghế xe lăn';
      return { key: type.seatType, label, price: pricing ?? 0 };
    });

    const ticketCounts = Object.fromEntries(
      data.ticketPrices.map((t) => [t.seatType, 0])
    ) as Record<SeatTypeEnum, number>;

    set({
      currentShowtimeId: data.showtime.id,
      seatMap,
      seatReservationStatus,
      seatHeldByUser,
      selectedSeats,
      tickets,
      ticketCounts,
      maxTickets: data.rules.max_selectable,
      seatLabelToId,
      seatIdToLabel,
    });
  },

  // ---------------- toggleSeat ----------------
  toggleSeat: (seatLabel: string) => {
    const {
      selectedSeats,
      tickets,
      seatReservationStatus,
      seatLabelToId,
      seatMap,
      maxTickets,
    } = get();

    if (seatReservationStatus[seatLabel] === ReservationStatusEnum.CONFIRMED) {
      toast.error('Ghế này đã được đặt!');
      return;
    }

    const isHeldByOther =
      seatReservationStatus[seatLabel] === ReservationStatusEnum.HELD &&
      !get().seatHeldByUser[seatLabel];

    if (isHeldByOther) {
      toast.error('Ghế này đang được giữ bởi người dùng khác!');
      return;
    }
    // Tìm seat object
    const allSeats = seatMap.flatMap((row) => row.seats);
    const seatObj = allSeats.find((s) => s.id === seatLabelToId[seatLabel]);
    if (!seatObj) return;

    let newSeats: string[];
    if (selectedSeats.includes(seatLabel)) {
      // bỏ ghế
      newSeats = selectedSeats.filter((s) => s !== seatLabel);
    } else {
      if (selectedSeats.length > maxTickets) {
        toast.error(`Chỉ được chọn tối đa ${maxTickets} ghế!`);
        return;
      }
      // thêm ghế
      newSeats = [...selectedSeats, seatLabel];
    }

    // 🔹 Tính lại ticketCounts theo loại ghế
    const newTicketCounts: Record<SeatTypeEnum, number> = {
      [SeatTypeEnum.STANDARD]: 0,
      [SeatTypeEnum.VIP]: 0,
      [SeatTypeEnum.COUPLE]: 0,
      [SeatTypeEnum.PREMIUM]: 0,
      [SeatTypeEnum.WHEELCHAIR]: 0,
    };
    newSeats.forEach((label) => {
      const seat = allSeats.find((s) => s.id === seatLabelToId[label]);
      if (seat) {
        newTicketCounts[seat.seatType] =
          (newTicketCounts[seat.seatType] ?? 0) + 1;
      }
    });

    // 🔹 Tính lại tổng số vé
    const totalTickets = newSeats.length;

    // 🔹 Tính lại tổng tiền
    const newTotalPrice = tickets.reduce(
      (sum, t) => sum + t.price * (newTicketCounts[t.key] ?? 0),
      0
    );
    if (newSeats.length === 0) set({ holdTimeSeconds: 600 });

    set({
      selectedSeats: newSeats,
      ticketCounts: newTicketCounts,
      totalTickets,
      totalTicketPrice: newTotalPrice,
    });

    // emit socket
    if (socket) {
      const seatId = seatLabelToId[seatLabel];
      console.log('Emitting socket for seatId:', seatId);
      if (selectedSeats.includes(seatLabel)) {
        socket.emit('release_seat', { showtimeId: getShowtimeId(), seatId });
      } else {
        socket.emit('hold_seat', { showtimeId: getShowtimeId(), seatId });
      }
    }
  },
  concessionSelections: {},
  concessionMap: {},
  promotionCode: null,
  discountAmount: 0,
  totalConcessionPrice: 0,
  setConcessionSelection: (id, qty, meta) => {
    const state = get();

    const newSelections = {
      ...state.concessionSelections,
      [id]: qty,
    };

    // Lưu thông tin name + price chỉ 1 lần (meta từ FoodSelector truyền vào)
    const newMap = { ...state.concessionMap };
    if (meta) {
      newMap[id] = meta;
    }

    // Tính tổng tiền concession
    let totalConcessionPrice = 0;
    Object.entries(newSelections).forEach(([cid, quantity]) => {
      const price = newMap[cid]?.price ?? 0;
      totalConcessionPrice += price * quantity;
    });

    set({
      concessionSelections: newSelections,
      concessionMap: newMap,
      totalConcessionPrice,
    });
  },

  setPromotionCode: (code, amount) => {
    set({
      promotionCode: code,
      discountAmount: amount,
    });
  },

  buildBookingPayload: () => {
    const state = get();
    const concessions = Object.entries(state.concessionSelections)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        concessionId: id,
        quantity: qty,
      }));

    return {
      concessions: concessions.length > 0 ? concessions : undefined,

      promotionCode: state.promotionCode || undefined,
    };
  },

  buildPreviewData: () => {
    const state = get();

    const seatGroups: Record<
      string,
      { type: string; quantity: number; price: number }
    > = {};

    state.selectedSeats.forEach((label) => {
      const id = state.seatLabelToId[label];
      const seat = state.seatMap
        .flatMap((r) => r.seats)
        .find((s) => s.id === id);
      if (!seat) return;

      const ticket = state.tickets.find((t) => t.key === seat.seatType);
      if (!ticket) return;

      if (!seatGroups[seat.seatType]) {
        seatGroups[seat.seatType] = {
          type: ticket.label, // Ghế thường / VIP / Premium...
          quantity: 0,
          price: ticket.price, // giá của 1 vé
        };
      }

      seatGroups[seat.seatType].quantity += 1;
    });

    const seats: SeatItem[] = Object.values(seatGroups);

    const concessions = Object.entries(state.concessionSelections)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        name: state.concessionMap[id]?.name ?? 'Món',
        price: state.concessionMap[id]?.price ?? 0,
        quantity: qty,
      }));
    const rawTotal =
      state.totalTicketPrice +
      state.totalConcessionPrice -
      state.discountAmount;
    // Cap at 0 to prevent negative totals
    const totalFinal = Math.max(0, rawTotal);
    return {
      seats,
      concessions,
      discountCode: state.promotionCode,
      discountAmount: state.discountAmount,
      total: totalFinal,
    };
  },
  getVoucherExcessAmount: () => {
    const state = get();
    const subtotal = state.totalTicketPrice + state.totalConcessionPrice;
    const excess = state.discountAmount - subtotal;
    return excess > 0 ? excess : 0;
  },
  getTotalFinal: () => {
    const state = get();
    const rawTotal =
      state.totalTicketPrice +
      state.totalConcessionPrice -
      state.discountAmount;
    // Cap at 0 to prevent negative totals
    return Math.max(0, rawTotal);
  },

  updateHoldTimeSeconds: (seconds: number) => {
    set({ holdTimeSeconds: seconds });
    console.log('Updated holdTimeSeconds to', seconds);
  },

  // ---------------- Socket ----------------
  connectSocket: (showtimeId: string, userId: string) => {
    if (socket && socket.connected) return;

    socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      withCredentials: true,
      query: { showtimeId },
    });

    socket.on('connect', () => set({ socketConnected: true }));
    socket.on('disconnect', () => set({ socketConnected: false }));

    socket.on('seat_held', (data: SeatEvent) => {
      const label = get().seatIdToLabel[data.seatId];
      if (!label) return;
      set((state) => ({
        seatReservationStatus: {
          ...state.seatReservationStatus,
          [label]: ReservationStatusEnum.HELD,
        },
        seatHeldByUser: {
          ...state.seatHeldByUser,
          [label]: data.userId === userId,
        },
      }));
    });

    socket.on('seat_released', (data: SeatEvent) => {
      const label = get().seatIdToLabel[data.seatId];
      if (!label) return;
      set((state) => ({
        seatReservationStatus: {
          ...state.seatReservationStatus,
          [label]: ReservationStatusEnum.AVAILABLE,
        },
        seatHeldByUser: { ...state.seatHeldByUser, [label]: false },
      }));
    });

    socket.on('seat_booked', (data: SeatBookingEvent) => {
      const { seatIds } = data;

      const labels = seatIds
        .map((id) => get().seatIdToLabel[id])
        .filter(Boolean);
      if (labels.length === 0) return;
      set((state) => {
        const newStatus = { ...state.seatReservationStatus };
        const newSelected = [...state.selectedSeats];

        labels.forEach((label) => {
          newStatus[label] = ReservationStatusEnum.CONFIRMED;
          // xoá khỏi selectedSeats nếu có
          const idx = newSelected.indexOf(label);
          if (idx !== -1) newSelected.splice(idx, 1);
        });

        return {
          seatReservationStatus: newStatus,
          selectedSeats: newSelected,
        };
      });
    });

    socket.on('limit_reached', () =>
      toast.error('Bạn đã chọn quá số ghế cho phép!')
    );
  },

  disconnectSocket: () => {
    if (socket) socket.disconnect();
    socket = null;
    set({ socketConnected: false });
  },

  resetBooking: () => {
    // Reset toàn bộ state liên quan đến quá trình booking
    set({
      bookingId: undefined,
      currentShowtimeId: null,
      selectedSeats: [],
      seatReservationStatus: {},
      seatHeldByUser: {},
      seatMap: [],
      tickets: [],
      ticketCounts: {} as Record<SeatTypeEnum, number>,
      maxTickets: 8,
      totalTicketPrice: 0,
      totalTickets: 0,
      holdTimeSeconds: 60,
      seatLabelToId: {},
      seatIdToLabel: {},
      concessionSelections: {},
      concessionMap: {},
      totalConcessionPrice: 0,
      promotionCode: null,
      discountAmount: 0,
    });
  },
}));

function getShowtimeId() {
  return useBookingStore.getState().currentShowtimeId;
}
