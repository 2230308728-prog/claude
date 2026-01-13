import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { Role, UserStatus } from '@prisma/client';
import {
  AdminRegisterDto,
  AdminLoginDto,
  WechatLoginDto,
} from './dto';

/**
 * JWT Payload 接口（扩展）
 */
interface JwtPayloadExtended {
  sub: number;
  role: Role;
  type: 'access' | 'refresh';
  exp?: number;
}

/**
 * Token 响应接口
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email?: string;
    nickname?: string;
    avatarUrl?: string;
    role: Role;
  };
}

/**
 * AuthService - 认证服务
 *
 * 处理用户注册、登录、令牌生成和验证
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly ACCESS_TOKEN_EXPIRATION = '15m';
  private readonly REFRESH_TOKEN_EXPIRATION = '7d';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cache: CacheService,
  ) {}

  /**
   * 管理员注册
   */
  async adminRegister(dto: AdminRegisterDto): Promise<TokenResponse> {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(
      dto.password,
      this.SALT_ROUNDS,
    );

    // 创建管理员用户
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        nickname: dto.nickname || '管理员',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    // 存储密码（在实际应用中应该使用单独的密码表）
    await this.cache.set(`user:password:${user.id}`, hashedPassword);

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.role);

    this.logger.log(`Admin registered: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email ?? undefined,
        nickname: user.nickname ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
        role: user.role,
      },
    };
  }

  /**
   * 管理员登录
   */
  async adminLogin(dto: AdminLoginDto): Promise<TokenResponse> {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    if (user.role !== Role.ADMIN) {
      throw new UnauthorizedException('该账号不是管理员账号');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 从缓存获取密码
    const hashedPassword = await this.cache.get(`user:password:${user.id}`);

    if (!hashedPassword) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(dto.password, hashedPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.role);

    this.logger.log(`Admin logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email ?? undefined,
        nickname: user.nickname ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
        role: user.role,
      },
    };
  }

  /**
   * 微信授权登录
   */
  async wechatLogin(dto: WechatLoginDto): Promise<TokenResponse> {
    try {
      // 调用微信 API 获取 openid 和 session_key
      const wechatApiUrl = 'https://api.weixin.qq.com/sns/jscode2session';
      const response = await axios.get(wechatApiUrl, {
        params: {
          appid: process.env.WECHAT_APP_ID,
          secret: process.env.WECHAT_APP_SECRET,
          js_code: dto.code,
          grant_type: 'authorization_code',
        },
      });

      const { openid, session_key, errcode, errmsg } = response.data;

      if (errcode) {
        this.logger.error(`WeChat API error: ${errcode} - ${errmsg}`);
        throw new UnauthorizedException('微信授权失败，请重试');
      }

      // 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { openid },
      });

      if (!user) {
        // 创建新用户
        user = await this.prisma.user.create({
          data: {
            openid,
            nickname: dto.userInfo?.nickName || '微信用户',
            avatarUrl: dto.userInfo?.avatarUrl,
            role: Role.PARENT,
            status: UserStatus.ACTIVE,
          },
        });
        this.logger.log(`New WeChat user created: ${user.id}`);
      } else {
        // 更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            nickname: dto.userInfo?.nickName || user.nickname,
            avatarUrl: dto.userInfo?.avatarUrl || user.avatarUrl,
          },
        });
      }

      // 生成令牌
      const tokens = await this.generateTokens(user.id, user.role);

      this.logger.log(`WeChat user logged in: ${user.id}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          nickname: user.nickname ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('WeChat login failed', error);
      throw new UnauthorizedException('微信授权失败，请重试');
    }
  }

  /**
   * 刷新令牌
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // 验证刷新令牌
      const payload = await this.jwtService.verifyAsync<JwtPayloadExtended>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 检查令牌是否在黑名单中
      const blacklistedValue = await this.cache.get(
        `token:blacklist:${refreshToken}`,
      );

      if (blacklistedValue === 'true') {
        throw new UnauthorizedException('令牌已失效');
      }

      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      // 将旧刷新令牌加入黑名单
      await this.cache.set(
        `token:blacklist:${refreshToken}`,
        'true',
        7 * 24 * 60 * 60, // 7天
      );

      // 生成新令牌
      const tokens = await this.generateTokens(user.id, user.role);

      this.logger.log(`Tokens refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  /**
   * 登出（将令牌加入黑名单）
   */
  async logout(userId: number, accessToken: string): Promise<void> {
    // 将访问令牌加入黑名单
    const decoded = this.jwtService.decode(accessToken) as JwtPayloadExtended;
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      await this.cache.set(`token:blacklist:${accessToken}`, 'true', ttl);
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * 验证访问令牌
   */
  async validateAccessToken(token: string): Promise<JwtPayloadExtended | null> {
    try {
      // 检查令牌是否在黑名单中
      const blacklistedValue = await this.cache.get(
        `token:blacklist:${token}`,
      );

      if (blacklistedValue === 'true') {
        return null;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayloadExtended>(token);

      if (payload.type !== 'access') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(
    userId: number,
    role: Role,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          role,
          type: 'access',
        } as JwtPayloadExtended,
        {
          expiresIn: this.ACCESS_TOKEN_EXPIRATION,
          secret: process.env.JWT_SECRET,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          role,
          type: 'refresh',
        } as JwtPayloadExtended,
        {
          expiresIn: this.REFRESH_TOKEN_EXPIRATION,
          secret: process.env.JWT_SECRET,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * 定时清理过期的黑名单令牌
   * 每天凌晨 2 点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.log('Cleaning up expired tokens from blacklist');
    // Redis 会自动清理过期的键，这里只是记录日志
  }
}
