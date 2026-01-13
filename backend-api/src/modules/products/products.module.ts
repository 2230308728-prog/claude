import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { OssModule } from '../../common/oss/oss.module';
import { AuthModule } from '../auth/auth.module';

/**
 * ProductsModule - 产品模块
 *
 * 提供产品和产品分类的 CRUD 功能
 */
@Module({
  imports: [
    PrismaModule,
    CacheModule,
    OssModule,
    AuthModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
