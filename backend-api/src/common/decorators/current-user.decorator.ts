import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';

/**
 * AuthUser - 认证用户接口
 *
 * 从 JWT 令牌中提取的用户信息
 */
export interface AuthUser {
  id: number;
  role: Role;
  status: UserStatus;
}

/**
 * @CurrentUser() - 获取当前登录用户信息的装饰器
 *
 * 从 JWT 中提取的用户信息
 *
 * 使用示例:
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);

/**
 * @UserInfo() - 获取用户特定信息的装饰器
 *
 * 可以指定返回用户对象的特定属性
 *
 * 使用示例:
 * @Get('profile')
 * getProfile(@UserInfo('id') userId: number) {
 *   return userId;
 * }
 */
export const UserInfo = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    return data ? user?.[data as keyof AuthUser] : user;
  },
);

/**
 * @ClientIp() - 获取客户端 IP 地址的装饰器
 *
 * 使用示例:
 * @Post('log')
 * logAction(@ClientIp() ip: string) {
 *   console.log(`Action from ${ip}`);
 * }
 */
export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip ||
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           'unknown';
  },
);

/**
 * @Roles() - 设置角色要求的装饰器
 *
 * 用于限制特定角色才能访问的路由
 *
 * 使用示例:
 * @Post()
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * createProduct() {
 *   // 只有管理员可以访问
 * }
 */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

/**
 * @Public() - 标记公共路由的装饰器
 *
 * 用于标记不需要认证即可访问的路由
 *
 * 使用示例:
 * @Post('login')
 * @Public()
 * login() {
 *   // 无需认证即可访问
 * }
 */
export const Public = () => SetMetadata('isPublic', true);
