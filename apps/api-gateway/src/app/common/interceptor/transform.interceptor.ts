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
    const request: Request = context.switchToHttp().getRequest();
    const requestPath = request.url.split('?')[0];

    if (
      requestPath === '/metrics' ||
      requestPath === '/api/metrics' ||
      requestPath === '/health' ||
      requestPath === '/api/health' ||
      requestPath === '/api/health/live' ||
      requestPath === '/api/health/ready'
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const request: Request = context.switchToHttp().getRequest();

        // Standardize the response structure
        // We want: { success: true, data: T, meta?: Meta, message?: string, ... }
        let responseData: any;

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // If it's already a ServiceResult style object { data, meta?, message? }
          if ('data' in data) {
            responseData = { ...data };
          } else {
            // It's a plain object (e.g. from a service that doesn't use ServiceResult)
            // Wrap it in data
            responseData = { data };
            
            // Move message and meta to top level if they exist in the object
            if ('message' in (data as any)) {
              responseData.message = (data as any).message;
              delete responseData.data.message;
            }
            if ('meta' in (data as any)) {
              responseData.meta = (data as any).meta;
              delete responseData.data.meta;
            }
          }
        } else {
          // It's an array, a primitive, or null
          responseData = { data };
        }

        // Final cleanup of meta
        if (responseData.meta === null || responseData.meta === undefined) {
          delete responseData.meta;
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
