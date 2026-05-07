import { Controller } from '@nestjs/common';
import { HallService } from './hall.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CinemaMessage,
  CreateHallRequest,
  HallStatusEnum,
  UpdateCinemaRequest,
  UpdateSeatStatusRequest,
} from '@movie-hub/shared-types';

@Controller('hall')
export class HallController {
  constructor(private readonly hallService: HallService) {}

  // Controller methods will be implemented here
  @MessagePattern(CinemaMessage.HALL.GET_DETAIL)
  async getHallDetail(@Payload() hallId: string) {
    return await this.hallService.getHallById(hallId);
  }

  @MessagePattern(CinemaMessage.HALL.GET_BY_CINEMA)
  async getHallsOfCinema(
    @Payload() payload: { cinemaId: string; status: HallStatusEnum }
  ) {
    return await this.hallService.getHallsOfCinema(
      payload.cinemaId,
      payload.status
    );
  }

  @MessagePattern(CinemaMessage.HALL.CREATE)
  async createHall(@Payload() createHallRequest: CreateHallRequest) {
    return await this.hallService.createHall(createHallRequest);
  }

  @MessagePattern(CinemaMessage.HALL.UPDATE)
  async updateHall(
    @Payload() data: { hallId: string; updateHallRequest: UpdateCinemaRequest }
  ) {
    const { hallId, updateHallRequest } = data;
    return await this.hallService.updateHall(hallId, updateHallRequest);
  }

  @MessagePattern(CinemaMessage.HALL.DELETE)
  async deleteHall(@Payload() hallId: string) {
    return await this.hallService.deleteHall(hallId);
  }

  @MessagePattern(CinemaMessage.HALL.UPDATE_SEAT_STATUS)
  async updateSeatStatus(
    @Payload()
    data: {
      seatId: string;
      updateSeatStatusRequest: UpdateSeatStatusRequest;
    }
  ) {
    const { seatId, updateSeatStatusRequest } = data;
    return await this.hallService.updateSeatStatus(
      seatId,
      updateSeatStatusRequest
    );
  }

  @MessagePattern('cinema.getHallCapacities')
  async getHallCapacities(@Payload() payload?: { cinemaIds?: string[] }) {
    return this.hallService.getHallCapacities(payload?.cinemaIds);
  }
}
