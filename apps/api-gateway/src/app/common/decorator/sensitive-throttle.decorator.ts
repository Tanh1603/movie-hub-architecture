import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

// Stricter profile for abuse-prone endpoints: short burst + sustained limit.
export function SensitiveThrottle() {
  return applyDecorators(
    Throttle({
      sensitiveBurst: {
        ttl: 10_000,
        limit: 40,
        blockDuration: 60_000,
      },
      sensitiveSustained: {
        ttl: 60_000,
        limit: 100,
        blockDuration: 120_000,
      },
    })
  );
}
