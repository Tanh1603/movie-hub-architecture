import {
  CreateStaffRequest,
  SERVICE_NAME,
  StaffQuery,
  UpdateStaffRequest,
  UserMessage,
} from '@movie-hub/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StaffService {
  constructor(
    @Inject(SERVICE_NAME.USER) private readonly client: ClientProxy
  ) {}

  async findAll(query: StaffQuery) {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.STAFF.GET_LIST, query)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne(id: string) {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.STAFF.GET_DETAIL, id)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async create(dto: CreateStaffRequest) {
    try {
      return await firstValueFrom(this.client.send(UserMessage.STAFF.CREATED, dto));
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(id: string, dto: UpdateStaffRequest) {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.STAFF.UPDATED, { id, data: dto })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async remove(id: string) {
    try {
      return await firstValueFrom(this.client.send(UserMessage.STAFF.DELETED, id));
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
