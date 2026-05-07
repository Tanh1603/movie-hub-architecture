import {
  HallDetailResponse,
  HallStatusEnum,
  HallSummaryResponse,
  LayoutTypeEnum,
  PhysicalSeatRowDto,
  SeatResponse,
  SeatStatusEnum,
  SeatTypeEnum,
} from '@movie-hub/shared-types';
import { Halls, Seats } from '../../../generated/prisma';
import { HallSeatsTemplates } from './seat-template';

export class HallMapper {
  /** Map request -> dữ liệu lưu DB */
  static toHallCreate(request) {
    const template = HallSeatsTemplates[request.layoutType];
    return {
      cinema_id: request.cinemaId,
      name: request.name,
      type: request.type,
      screen_type: request.screenType,
      sound_system: request.soundSystem,
      features: request.features,
      layout_type: request.layoutType,
      capacity: template.capacity,
      rows: template.rows,
      seats: {
        create: template.seats,
      },
    };
  }

  static toHallUpdate(request) {
    const {
      cinemaId,
      name,
      type,
      screenType,
      soundSystem,
      features,
      status,
    } = request;
    return {
      ...(cinemaId !== undefined && { cinema_id: cinemaId }),
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(screenType !== undefined && { screen_type: screenType }),
      ...(soundSystem !== undefined && { sound_system: soundSystem }),
      ...(features !== undefined && { features }),
      ...(status !== undefined && { status }),
    };
  }

  /** Map entity -> summary response */
  static toSummaryResponse(hall: Halls): HallSummaryResponse {
    return {
      id: hall.id,
      name: hall.name,
      type: hall.type,
      capacity: hall.capacity,
      rows: hall.rows,
      status: hall.status as HallStatusEnum,
      screenType: hall.screen_type,
      soundSystem: hall.sound_system,
    };
  }

  /** Map entity -> seat response */
  static toSeatResponse(seat: Seats): SeatResponse {
    return {
      id: seat.id,
      rowLetter: seat.row_letter,
      seatNumber: seat.seat_number,
      type: seat.type as SeatTypeEnum,
      status: seat.status as SeatStatusEnum,
    };
  }

  /** Map entity -> detail response */
  static toDetailResponse(
    hall: Halls & { seats?: Seats[] }
  ): HallDetailResponse {
    return {
      id: hall.id,
      cinemaId: hall.cinema_id,
      name: hall.name,
      type: hall.type,
      capacity: hall.capacity,
      rows: hall.rows,
      screenType: hall.screen_type,
      soundSystem: hall.sound_system,
      features: hall.features,
      status: hall.status as HallStatusEnum,
      layoutType: hall.layout_type as LayoutTypeEnum,
      seatMap: this.mapSeatRow(hall.seats?.map(this.toSeatResponse) || []),
      createdAt: hall.created_at,
      updatedAt: hall.updated_at,
    };
  }

  static mapSeatRow(seats: SeatResponse[]): PhysicalSeatRowDto[] {
    if (!seats || seats.length === 0) return [];

    // Group theo row_letter
    const grouped = seats.reduce((acc, seat) => {
      const row = seat.rowLetter;

      if (!acc[row]) {
        acc[row] = [];
      }
      acc[row].push(seat);
      return acc;
    }, {} as Record<string, SeatResponse[]>);

    // Convert sang dạng DTO + sort theo row và seat_number
    return Object.entries(grouped)
      .sort(([rowA], [rowB]) => rowA.localeCompare(rowB)) // sort A, B, C...
      .map(([row, seats]) => ({
        row,
        seats: seats.sort((a, b) => a.seatNumber - b.seatNumber),
      }));
  }
}
