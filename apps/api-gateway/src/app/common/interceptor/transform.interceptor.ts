import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        const request: Request = context.switchToHttp().getRequest();

        // Handle case where data is already wrapped in a response object from microservice
        // or where data is a plain array
        let responseData: Record<string, unknown>;

        if (Array.isArray(data)) {
          // If data is an array, wrap it in a { data: [...] } object
          responseData = { data };
        } else if (data && typeof data === 'object') {
          // If data is an object, use it directly but ensure meta cleanup
          if (
            Object.prototype.hasOwnProperty.call(data, 'meta') &&
            !data.meta
          ) {
            delete data.meta; // Remove meta if it's null or undefined
          }
          responseData = data;
        } else {
          // For primitives or null/undefined
          responseData = { data };
        }

        return {
          success: true,
          ...responseData,
          timestamp: new Date().toISOString(),
          path: request.path,
        };
      })
    );
  }
}
