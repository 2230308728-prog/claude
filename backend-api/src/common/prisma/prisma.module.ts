import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Prisma 模块
 *
 * @Global 装饰器使该模块在整个应用中可用，无需在其他模块中重复导入
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
