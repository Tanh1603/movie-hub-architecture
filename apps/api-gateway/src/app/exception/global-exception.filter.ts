/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiErrorResponse } from '@movie-hub/shared-types/common';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod/v4/classic/errors.cjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();
    // const status = exception.getStatus();

    let errorResponse: ApiErrorResponse;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof ZodValidationException) {
      status = exception.getStatus();
      errorResponse = {
        success: false,
        message: exception.message,
        errors: (exception.getZodError() as ZodError).issues.map((e) => {
          return {
            message: e.message,
            code: e?.code || 'invalid_type',
            field: e?.path.join('.'),
          };
        }),
        timestamp: new Date().toISOString(),
        path: request.path,
      };
    } else if (exception instanceof RpcException) {
      const error = exception.getError() as any;
      status = error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        message: error?.summary || 'Internal server error',
        errors: [
          {
            code: error?.code || 'UNKNOWN_ERROR',
            field: error?.field,
            message: error?.message || 'Internal server error',
          },
        ],
        path: request.path,
        timestamp: new Date().toISOString(),
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse() as any;
      errorResponse = {
        success: false,
        message: responseBody.message || exception.message || 'Error',
        errors: [
          {
            code:
              typeof responseBody.error === 'string'
                ? responseBody.error
                : 'HTTP_ERROR',
            field: null,
            message: Array.isArray(responseBody.message)
              ? responseBody.message.join(', ')
              : responseBody.message || exception.message,
          },
        ],
        path: request.path,
        timestamp: new Date().toISOString(),
      };
    } else if (exception?.error?.statusCode) {
      const err = exception.error;

      response.status(err.statusCode).json({
        success: false,
        message: err.summary,
        errors: [
          {
            code: err.statusCode,
            field: err.field ?? null,
            message: err.message,
          },
        ],
        path: request.path,
        timestamp: new Date().toISOString(),
      });
      return;
    } else {
      errorResponse = {
        success: false,
        message: exception.message || 'Unexpected error',
        errors: [
          {
            code: 'INTERNAL_ERROR',
            field: null,
            message: (exception as any)?.message || 'Something went wrong',
          },
        ],
        path: request.path,
        timestamp: new Date().toISOString(),
      };
    }

    response.status(status).json(errorResponse);
  }
}
