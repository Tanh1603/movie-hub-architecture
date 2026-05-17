import { createClerkClient } from '@clerk/clerk-sdk-node';
import { Global, Module } from '@nestjs/common';

export const CLERK_CLIENT = 'CLERK_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: CLERK_CLIENT,
      useFactory: () => {
        const secretKey = process.env.CLERK_SECRET_KEY;
        if (!secretKey) {
          throw new Error('CLERK_SECRET_KEY is required');
        }
        return createClerkClient({ secretKey });
      },
    },
  ],
  exports: [CLERK_CLIENT],
})
export class ClerkModule {}
