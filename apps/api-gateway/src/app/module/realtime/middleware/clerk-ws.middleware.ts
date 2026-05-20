// api-gateway/src/app/module/realtime/middleware/clerk-ws.middleware.ts
import { clerkClient } from '@clerk/clerk-sdk-node';
import * as cookie from 'cookie';
import { Logger } from '@nestjs/common';

const logger = new Logger('ClerkWsMiddleware');

export const clerkWsMiddleware = async (socket, next) => {
  try {
    // ✅ 1️⃣ Lấy token từ handshake.auth (browser gửi được)
    const authToken = socket.handshake?.auth?.token;

    // 2️⃣ Fallback: lấy token từ cookie (nếu có — ví dụ Node client)
    const cookieHeader = socket.handshake.headers?.cookie;
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
    const cookieToken = cookies['__session'];

    const token = authToken || cookieToken;
    if (!token) {
      logger.warn('❌ No token found in handshake (auth or cookie)');
      return next(new Error('Unauthorized'));
    }

    // 3️⃣ Verify token qua Clerk SDK
    const session = await clerkClient.verifyToken(token, {
      clockSkewInMs: 60000,
    });
    socket.user = { id: session.sub };
    logger.log(`✅ Authenticated user ${session.sub}`);
    next();
  } catch (err) {
    logger.error('❌ Clerk verification failed', err);
    next(new Error('Unauthorized'));
  }
};
