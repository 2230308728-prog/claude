import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * RefundsModule - 退款模块
 *
 * 提供退款申请、审核、微信退款等功能
 */
@Module({
  imports: [PrismaModule, CacheModule, AuthModule, NotificationsModule],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
