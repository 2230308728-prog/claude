import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';
import { Role, UserStatus } from '@prisma/client';

/**
 * JWT Payload 接口
 */
interface JwtPayload {
  sub: number;
  role: Role;
  type: 'access' | 'refresh';
}

/**
 * JwtStrategy - JWT 认证策略
 *
 * 使用 Passport JWT 策略验证 JWT 令牌
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'bmad_jwt_secret_key_change_in_production_2024',
      passReqToCallback: true,
    };
    super(options);
  }

  /**
   * 验证 JWT 令牌
   */
  async validate(req: Request, payload: JwtPayload): Promise<{
    id: number;
    role: Role;
    status: UserStatus;
  }> {
    // 只验证访问令牌
    if (payload.type !== 'access') {
      throw new UnauthorizedException('无效的令牌类型');
    }

    // 检查令牌是否在黑名单中
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);
    if (token) {
      const blacklistedValue = await this.cache.get(`token:blacklist:${token}`);

      if (blacklistedValue === 'true') {
        throw new UnauthorizedException('令牌已失效');
      }
    }

    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    return {
      id: user.id,
      role: user.role,
      status: user.status,
    };
  }
}
