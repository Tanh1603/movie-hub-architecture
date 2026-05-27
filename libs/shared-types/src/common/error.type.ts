import { ResponseMessage } from './response-message.enum';

export interface ErrorDetail{
  code: string | number;
  message: ResponseMessage | string;
  field?: string;
}
