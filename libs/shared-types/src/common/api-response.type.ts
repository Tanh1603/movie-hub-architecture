import { ErrorDetail } from './error.type';
import { PaginationMeta } from './pagination.type';
import { ResponseMessage } from './response-message.enum';

interface BaseResponse {
  success: boolean;
  timestamp: string;
  path: string;
}

export interface ApiSuccessResponse<T> extends BaseResponse {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: ResponseMessage;
}

export interface ApiErrorResponse extends BaseResponse {
  success: false;
  message: ResponseMessage;
  errors?: ErrorDetail[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
