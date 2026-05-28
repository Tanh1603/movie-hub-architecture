import { SetMetadata } from '@nestjs/common';

export const ALLOWED_IPS_KEY = 'allowedIps';

/**
 * Giới hạn IP truy cập vào Endpoint (thường dùng cho Webhook).
 * @param ips Mảng các IP hoặc tiền tố IP (VD: ['113.160.92.', '127.0.0.1'])
 * Hoặc truyền vào 1 chuỗi là tên biến môi trường (VD: 'PAYMENT_WEBHOOK_IPS')
 */
export const AllowedIps = (ips: string[] | string) => SetMetadata(ALLOWED_IPS_KEY, ips);
