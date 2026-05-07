import { SERVICE_NAME, UserMessage } from '@movie-hub/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class ConfigService {
  constructor(
    @Inject(SERVICE_NAME.USER) private readonly client: ClientProxy
  ) {}

  async findAll() {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.CONFIG.GET_LIST, {})
      );
    } catch (error) {
      console.error('ConfigService.findAll error:', error);
      throw new RpcException(error);
    }
  }

  async update(dto: { key: string; value: unknown; description?: string }) {
    try {
      return await firstValueFrom(
        this.client.send(UserMessage.CONFIG.UPDATED, dto)
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
