import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  QueryUsersDto,
  UpdateUserStatusDto,
} from './dto';

/**
 * UsersController - 用户管理控制器
 *
 * 处理用户管理、数据看板等
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // 用户管理
  // ============================================

  /**
   * 获取用户列表
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取用户列表', description: '管理员获取用户列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getUsers(@Query() query: QueryUsersDto) {
    return this.usersService.getUsers(query);
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取用户详情', description: '管理员获取用户详细信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户不存在',
  })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUser(id);
  }

  /**
   * 更新用户状态
   */
  @Put(':id/status')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '更新用户状态', description: '管理员更新用户状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户不存在',
  })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus(id, dto);
  }

  // ============================================
  // 数据看板
  // ============================================

  /**
   * 获取数据看板统计
   */
  @Get('dashboard/stats')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取数据看板统计', description: '管理员获取数据看板统计信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            totalOrders: { type: 'number' },
            totalRevenue: { type: 'string' },
            totalProducts: { type: 'number' },
          },
        },
        todayStats: {
          type: 'object',
          properties: {
            newUsers: { type: 'number' },
            newOrders: { type: 'number' },
            revenue: { type: 'string' },
          },
        },
        orderStats: {
          type: 'object',
          properties: {
            pending: { type: 'number' },
            paid: { type: 'number' },
            cancelled: { type: 'number' },
            refunded: { type: 'number' },
          },
        },
        recentOrders: { type: 'array' },
        topProducts: { type: 'array' },
      },
    },
  })
  async getDashboardStats() {
    return this.usersService.getDashboardStats();
  }

  /**
   * 获取订单统计数据
   */
  @Get('dashboard/order-stats')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取订单统计数据', description: '获取指定天数的订单统计' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: '统计天数（默认30天）',
  })
  async getOrderStats(@Query('days', ParseIntPipe) days?: number) {
    return this.usersService.getOrderStats(days);
  }
}
