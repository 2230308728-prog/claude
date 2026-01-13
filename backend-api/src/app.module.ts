import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { OssModule } from './common/oss/oss.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { UsersModule } from './modules/users/users.module';
import { CouponsModule } from './modules/coupons/coupons.module';

@Module({
  imports: [PrismaModule, CacheModule, OssModule, AuthModule, ProductsModule, OrdersModule, RefundsModule, UsersModule, CouponsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
