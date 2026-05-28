import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ALLOWED_IPS_KEY } from '../decorator/allowed-ips.decorator';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IpWhitelistGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metaIps = this.reflector.get<string[] | string>(
      ALLOWED_IPS_KEY,
      context.getHandler()
    );

    if (!metaIps || metaIps.length === 0) {
      return true; // Không có cấu hình => Bỏ qua
    }

    let allowedIps: string[] = [];

    // Hỗ trợ lấy IP từ biến môi trường nếu truyền vào string
    if (typeof metaIps === 'string') {
      const envIps = process.env[metaIps];
      if (envIps) {
        allowedIps = envIps.split(',').map((ip) => ip.trim());
      } else {
        this.logger.warn(`Biến môi trường ${metaIps} chưa được cấu hình`);
        // Nếu môi trường test (local), tạm cho qua, production thì phải chặn
        if (process.env.NODE_ENV !== 'production') return true;
      }
    } else {
      allowedIps = metaIps;
    }

    if (allowedIps.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = request.ip || 'unknown';

    // Cho phép gọi localhost để test nội bộ
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      return true;
    }

    // Kiểm tra IP có khớp chính xác hoặc khớp tiền tố (prefix)
    const isAllowed = allowedIps.some(
      (ip) => clientIp === ip || clientIp.startsWith(ip)
    );

    if (!isAllowed) {
      this.logger.error(
        `Chặn Request Webhook từ IP lạ: ${clientIp}. Các IP cho phép: ${allowedIps.join(', ')}`
      );
      throw new ForbiddenException('IP không có quyền gọi Webhook này');
    }

    return true;
  }
}
