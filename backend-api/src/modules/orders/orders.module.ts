import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { ProductsModule } from '../products/products.module';
import { CouponsModule } from '../coupons/coupons.module';
import { AuthModule } from '../auth/auth.module';

/**
 * OrdersModule - 订单模块
 *
 * 提供订单创建、支付、查询等功能
 */
@Module({
  imports: [PrismaModule, CacheModule, ProductsModule, CouponsModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
