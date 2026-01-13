import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

/**
 * RolesGuard - 角色权限守卫
 *
 * 检查用户是否具有访问路由所需的角色
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由或控制器上设置的角色要求
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置角色要求，则允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 从请求中获取用户信息
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果没有用户信息，拒绝访问
    if (!user) {
      return false;
    }

    // 检查用户角色是否匹配
    return requiredRoles.some((role) => user.role === role);
  }
}
