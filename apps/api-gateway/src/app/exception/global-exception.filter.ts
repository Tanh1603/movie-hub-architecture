/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiErrorResponse,
  ResponseMessage,
} from '@movie-hub/shared-types/common';
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
      const zodIssues = (exception.getZodError() as ZodError).issues;
      errorResponse = {
        success: false,
        message: this.getZodResponseMessage(zodIssues),
        errors: zodIssues.map((e) => {
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
        message: this.getRpcResponseMessage(error),
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
        message: this.getHttpResponseMessage(status, responseBody, exception),
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
        message: this.getRpcResponseMessage(err),
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
      const isInternal = status >= 500 || status === HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        message: ResponseMessage.MSG_9,
        errors: [
          {
            code: isInternal ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR',
            field: null,
            message: isInternal ? 'Something went wrong on our end' : ((exception as any)?.message || 'Something went wrong'),
          },
        ],
        path: request.path,
        timestamp: new Date().toISOString(),
      };
    }

    // Force generic messages for ANY 5xx error
    if (status >= 500) {
      errorResponse.message = ResponseMessage.MSG_9;
      if (errorResponse.errors && errorResponse.errors.length > 0) {
        errorResponse.errors.forEach(e => {
          e.message = 'An unexpected error occurred';
          e.code = e.code === 'UNKNOWN_ERROR' ? 'INTERNAL_ERROR' : e.code;
        });
      }
    }

    response.status(status).json(errorResponse);
  }

  private getZodResponseMessage(
    issues: ReadonlyArray<{
      message?: unknown;
      path?: readonly unknown[];
      input?: unknown;
    }>
  ): ResponseMessage {
    return issues.some((issue) => this.isMissingRequiredFieldIssue(issue))
      ? ResponseMessage.MSG_1
      : ResponseMessage.MSG_4;
  }

  private isMissingRequiredFieldIssue(issue: {
    message?: unknown;
    path?: readonly unknown[];
    input?: unknown;
  }): boolean {
    const path = issue.path ?? [];
    const message = String(issue.message ?? '').toLowerCase();
    const details = issue as any;
    const hasInput = Object.prototype.hasOwnProperty.call(details, 'input');

    return (
      path.length > 0 &&
      ((hasInput && details.input === undefined) ||
        message.includes('required') ||
        message.includes('received undefined'))
    );
  }

  private getRpcResponseMessage(error: any): ResponseMessage {
    const duplicateMessage = this.getDuplicateResponseMessage(error);
    if (duplicateMessage) {
      return duplicateMessage;
    }

    const code = String(error?.code ?? '').toUpperCase();
    const statusCode = Number(error?.statusCode ?? error?.status ?? 0);
    const text = this.getErrorText(error);

    if (statusCode === HttpStatus.UNAUTHORIZED || text.includes('auth')) {
      return ResponseMessage.MSG_2;
    }

    if (
      code.includes('CONSTRAINT') ||
      code === 'P2003' ||
      statusCode === HttpStatus.CONFLICT ||
      text.includes('constraint')
    ) {
      return ResponseMessage.MSG_9;
    }

    return ResponseMessage.MSG_9;
  }

  private getHttpResponseMessage(
    status: number,
    responseBody: any,
    exception: HttpException
  ): ResponseMessage {
    const duplicateMessage = this.getDuplicateResponseMessage(responseBody);
    if (duplicateMessage) {
      return duplicateMessage;
    }

    const text = `${this.getErrorText(responseBody)} ${exception.message}`.toLowerCase();

    if (status === HttpStatus.UNAUTHORIZED || text.includes('auth')) {
      return ResponseMessage.MSG_2;
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return text.includes('format') || text.includes('invalid')
        ? ResponseMessage.MSG_4
        : ResponseMessage.MSG_9;
    }

    if (status === HttpStatus.CONFLICT || text.includes('constraint')) {
      return ResponseMessage.MSG_9;
    }

    return ResponseMessage.MSG_9;
  }

  private getDuplicateResponseMessage(error: any): ResponseMessage | null {
    const code = String(error?.code ?? error?.error ?? '').toUpperCase();
    const text = this.getErrorText(error);

    if (
      code === 'P2002' ||
      code.includes('DUPLICATE') ||
      code.includes('UNIQUE') ||
      text.includes('already exists') ||
      text.includes('unique')
    ) {
      if (text.includes('email')) {
        return ResponseMessage.MSG_5;
      }
      if (text.includes('phone')) {
        return ResponseMessage.MSG_6;
      }
      if (text.includes('username')) {
        return ResponseMessage.MSG_10;
      }
      return ResponseMessage.MSG_9;
    }

    return null;
  }

  private getErrorText(error: any): string {
    const messages = [
      error?.message,
      error?.summary,
      error?.field,
      error?.meta?.target,
      Array.isArray(error?.message) ? error.message.join(' ') : undefined,
    ];

    return messages
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value).toLowerCase())
      .join(' ');
  }
}
