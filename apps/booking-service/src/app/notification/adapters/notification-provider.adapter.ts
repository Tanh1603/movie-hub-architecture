export interface NotificationSendPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export abstract class NotificationProviderAdapter {
  abstract sendEmail(payload: NotificationSendPayload): Promise<boolean>;
}
