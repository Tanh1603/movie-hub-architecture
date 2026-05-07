import Redis from 'ioredis';

export class RedisTestUtil {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async clearKeys(pattern: string) {
    const stream = this.redis.scanStream({
      match: pattern,
    });
    
    stream.on('data', async (keys) => {
      if (keys.length) {
        const pipeline = this.redis.pipeline();
        keys.forEach((key) => {
          pipeline.del(key);
        });
        await pipeline.exec();
      }
    });

    return new Promise((resolve) => {
      stream.on('end', () => resolve(true));
    });
  }

  async clearSeatHolds(showtimeId: string) {
     // Keys: hold:showtime:{id}:{seatId} AND hold:user:{userId}:showtime:{id}
     await this.clearKeys(`hold:showtime:${showtimeId}:*`);
     await this.clearKeys(`hold:user:*:showtime:${showtimeId}`);
  }

  async disconnect() {
    await this.redis.quit();
  }
}
