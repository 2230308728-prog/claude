import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * CacheModule - Redis 缓存模块
 *
 * @Global 装饰器使该模块在整个应用中可用
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
