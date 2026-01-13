import { Global, Module } from '@nestjs/common';
import { OssService } from './oss.service';

/**
 * OssModule - 阿里云 OSS 模块
 *
 * @Global 装饰器使该模块在整个应用中可用
 */
@Global()
@Module({
  providers: [OssService],
  exports: [OssService],
})
export class OssModule {}
