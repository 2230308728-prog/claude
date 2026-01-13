import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService, TokenResponse } from './auth.service';
import {
  AdminRegisterDto,
  AdminLoginDto,
  WechatLoginDto,
  RefreshTokenDto,
} from './dto';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards';

/**
 * AuthController - 认证控制器
 *
 * 处理用户注册、登录、令牌刷新等
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 管理员注册
   */
  @Post('admin/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '管理员注册', description: '创建新的管理员账号' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                email: { type: 'string', example: 'admin@bmad.com' },
                nickname: { type: 'string', example: '超级管理员' },
                role: { type: 'string', example: 'ADMIN' },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '该邮箱已被注册',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: '该邮箱已被注册' },
        error: { type: 'string', example: 'Conflict' },
        timestamp: { type: 'string' },
      },
    },
  })
  async adminRegister(@Body() dto: AdminRegisterDto): Promise<TokenResponse> {
    return this.authService.adminRegister(dto);
  }

  /**
   * 管理员登录
   */
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理员登录', description: '使用邮箱和密码登录管理后台' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                nickname: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '邮箱或密码错误 / 账号已被禁用',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '邮箱或密码错误' },
        error: { type: 'string', example: 'Unauthorized' },
        timestamp: { type: 'string' },
      },
    },
  })
  async adminLogin(@Body() dto: AdminLoginDto): Promise<TokenResponse> {
    return this.authService.adminLogin(dto);
  }

  /**
   * 微信授权登录
   */
  @Post('wechat/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信授权登录', description: '家长使用微信授权登录小程序' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nickname: { type: 'string' },
                avatarUrl: { type: 'string' },
                role: { type: 'string', example: 'PARENT' },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '微信授权失败',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '微信授权失败，请重试' },
        error: { type: 'string', example: 'Unauthorized' },
        timestamp: { type: 'string' },
      },
    },
  })
  async wechatLogin(@Body() dto: WechatLoginDto): Promise<TokenResponse> {
    return this.authService.wechatLogin(dto);
  }

  /**
   * 刷新令牌
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新令牌', description: '使用刷新令牌获取新的访问令牌' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '无效的刷新令牌',
  })
  async refreshTokens(@Body() dto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  /**
   * 登出
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '登出', description: '将当前令牌加入黑名单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登出成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '登出成功' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
  })
  async logout(@CurrentUser() user: AuthUser, @Req() req: Request): Promise<{ message: string }> {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';

    await this.authService.logout(user.id, token);
    return { message: '登出成功' };
  }
}
