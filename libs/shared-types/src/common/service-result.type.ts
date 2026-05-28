import { PaginationMeta } from './pagination.type';
import { ResponseMessage } from './response-message.enum';

export interface ServiceResult<T> {
  data: T;

  meta?: PaginationMeta;

  message?: ResponseMessage;
}
