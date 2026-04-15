import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

  async setValue<T>(
    key: string,
    value: T,
    ttlInSeconds?: number
  ): Promise<void> {
    const jsonValue = JSON.stringify(value);

    if (ttlInSeconds) {
      await this.redisClient.set(key, jsonValue, 'EX', ttlInSeconds);
    } else {
      await this.redisClient.set(key, jsonValue);
    }
  }

  async getValue<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch (err) {
      return null;
    }
  }
}
