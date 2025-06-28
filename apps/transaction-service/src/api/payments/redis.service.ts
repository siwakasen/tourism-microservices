import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class AuthRedisService {
  private readonly redisClient;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'), // Redis server host
      port: this.configService.get<number>('REDIS_PORT'), // Redis server port
    });
  }
  async setValue(
    key: string,
    value: string,
    ttlInSeconds: number,
  ): Promise<void> {
    await this.redisClient.set(key, value);
    await this.redisClient.expire(key, ttlInSeconds);
  }

  async getValue(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }
}
