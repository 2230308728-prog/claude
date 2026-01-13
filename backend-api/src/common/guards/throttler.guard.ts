import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';

/**
 * ThrottlerGuard - 限流守卫
 *
 * 基于 Redis 的请求频率限制
 * 防止 API 被恶意调用
 */
@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否启用了限流
    const enableThrottler = this.reflector.get<boolean>(
      'enable-throttler',
      context.getHandler(),
    );

    if (enableThrottler === false) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 获取限流配置
    const ttl = this.reflector.get<number>('throttler-ttl', context.getHandler()) ||
                parseInt(process.env.THROTTLE_TTL || '60', 10);
    const limit = this.reflector.get<number>('throttler-limit', context.getHandler()) ||
                 parseInt(process.env.THROTTLE_LIMIT || '100', 10);

    // 获取客户端标识 (IP 地址)
    const identifier = this.getIdentifier(request);

    // 构建 Redis 键
    const key = `throttle:${identifier}`;

    try {
      // 获取当前计数
      const current = await this.cache.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= limit) {
        // 超过限制，返回 429 错误
        const resetTime = await this.cache.ttl(key);
        response.setHeader('Retry-After', resetTime);
        response.setHeader('X-RateLimit-Limit', limit);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + resetTime);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later',
            retryAfter: resetTime,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 增加计数
      if (count === 0) {
        // 第一次请求，设置过期时间
        await this.cache.incr(key);
        await this.cache.expire(key, ttl);
      } else {
        await this.cache.incr(key);
      }

      // 设置响应头
      const remaining = limit - count - 1;
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', remaining);
      response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + ttl);

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // 缓存错误，记录日志但不阻止请求
      this.logger.error(`Throttler error: ${error.message}`);
      return true;
    }
  }

  /**
   * 获取客户端标识符
   */
  private getIdentifier(request: any): string {
    // 优先使用用户 ID
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    // 其次使用 IP 地址
    const ip = request.ip ||
               request.connection?.remoteAddress ||
               request.socket?.remoteAddress ||
               'unknown';

    // 处理 IPv6 映射的 IPv4 地址
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }

    return ip;
  }
}

/**
 * 限流装饰器
 *
 * @param ttl 时间窗口（秒）
 * @param limit 请求数量限制
 */
export const Throttle = (ttl?: number, limit?: number) => {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata('enable-throttler', true, descriptor.value);
    if (ttl) {
      Reflect.defineMetadata('throttler-ttl', ttl, descriptor.value);
    }
    if (limit) {
      Reflect.defineMetadata('throttler-limit', limit, descriptor.value);
    }
    return descriptor;
  };
};
