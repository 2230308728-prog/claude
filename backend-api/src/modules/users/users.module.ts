import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';
import { AuthModule } from '../auth/auth.module';

/**
 * UsersModule - 用户管理模块
 *
 * 提供用户管理、数据看板等功能
 */
@Module({
  imports: [PrismaModule, CacheModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
