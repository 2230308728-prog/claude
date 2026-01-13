import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/**
 * JwtAuthGuard - JWT 认证守卫
 *
 * 使用 Passport JWT 策略验证请求
 * 支持通过 @Public() 装饰器标记公共路由
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否标记为公共路由
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    // 如果有错误或没有用户，抛出未授权异常
    if (err || !user) {
      throw err || new UnauthorizedException('未授权访问，请先登录');
    }

    return user;
  }
}
