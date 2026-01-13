import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';

/**
 * AuthModule - 认证模块
 *
 * 提供用户认证和授权功能
 */
@Module({
  imports: [
    PrismaModule,
    CacheModule,
    PassportModule,
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'bmad_jwt_secret_key_change_in_production_2024',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRATION as any) || '15m',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    RolesGuard,
  ],
})
export class AuthModule {}
