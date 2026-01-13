import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * CacheService - Redis 缓存服务
 *
 * 提供 Redis 缓存操作的基础方法
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis;
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    const redisOptions = {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    this.client = new Redis(redisOptions);
    this.publisher = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);

    // 错误处理
    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });

    this.subscriber.on('error', (err) => {
      this.logger.error(`Redis subscriber error: ${err.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      // Redis 连接失败不阻止应用启动（降级策略）
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.publisher.quit();
    await this.subscriber.quit();
    this.logger.log('Redis disconnected');
  }

  /**
   * 获取缓存值
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error);
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key: ${key}`, error);
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key: ${key}`, error);
    }
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Failed to delete pattern: ${pattern}`, error);
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check key: ${key}`, error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Failed to set expire for key: ${key}`, error);
    }
  }

  /**
   * 原子递增操作
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key: ${key}`, error);
      return 0;
    }
  }

  /**
   * 原子递减操作
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement key: ${key}`, error);
      return 0;
    }
  }

  /**
   * 原子递增指定值
   */
  async incrBy(key: string, value: number): Promise<number> {
    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      this.logger.error(`Failed to increment key: ${key} by ${value}`, error);
      return 0;
    }
  }

  /**
   * 原子递减指定值
   */
  async decrBy(key: string, value: number): Promise<number> {
    try {
      return await this.client.decrby(key, value);
    } catch (error) {
      this.logger.error(`Failed to decrement key: ${key} by ${value}`, error);
      return 0;
    }
  }

  /**
   * 获取健康状态
   */
  async getHealthStatus(): Promise<{ status: string; error?: string }> {
    try {
      await this.client.ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * 清空所有缓存
   */
  async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
      this.logger.warn('Redis cache flushed');
    } catch (error) {
      this.logger.error('Failed to flush Redis cache', error);
    }
  }

  /**
   * 获取数据库信息
   */
  async getInfo(): Promise<any> {
    try {
      const info = await this.client.info('stats');
      return info;
    } catch (error) {
      this.logger.error('Failed to get Redis info', error);
      return null;
    }
  }

  /**
   * 获取键的剩余过期时间（秒）
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key: ${key}`, error);
      return -1;
    }
  }
}
