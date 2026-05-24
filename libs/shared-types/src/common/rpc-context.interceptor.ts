import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';
import { Observable } from 'rxjs';

export interface AppClsStore extends ClsStore {
  correlationId?: string;
  requestId?: string;
  userId?: string;
}

@Injectable()
export class RpcContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService<AppClsStore>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') return next.handle();

    const payload = context.switchToRpc().getData();
    return this.cls.runWith(
      {
        correlationId: payload?._meta?.correlationId,
        requestId: payload?._meta?.requestId,
        userId: payload?._meta?.userId,
      },
      () => next.handle()
    );
  }
}
