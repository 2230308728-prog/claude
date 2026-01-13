import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { Role, UserStatus, OrderStatus } from '@prisma/client';
import {
  QueryUsersDto,
  UpdateUserStatusDto,
} from './dto';

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Dashboard 统计数据接口（扁平化结构，匹配前端需求）
 */
export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  paidOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
}

/**
 * Dashboard 详情数据接口（包含recentOrders和topProducts）
 */
export interface DashboardDetail extends DashboardStats {
  recentOrders: any[];
  topProducts: any[];
}

/**
 * UsersService - 用户服务
 *
 * 处理用户管理、数据看板等功能
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ============================================
  // 用户管理
  // ============================================

  /**
   * 获取用户列表
   */
  async getUsers(query: QueryUsersDto): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, role, status, keyword } = query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        openid: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // 获取每个用户的订单统计
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await this.prisma.order.findMany({
          where: { userId: user.id },
          select: {
            status: true,
            totalAmount: true,
          },
        });

        const totalSpent = orders
          .filter((o) => o.status === OrderStatus.PAID)
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);

        return {
          ...user,
          totalOrders: orders.length,
          totalSpent: totalSpent.toFixed(2),
        };
      }),
    );

    return {
      data: usersWithStats,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取用户详情
   */
  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        openid: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取用户订单统计
    const orders = await this.prisma.order.findMany({
      where: { userId: id },
      select: {
        status: true,
        totalAmount: true,
      },
    });

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.status === OrderStatus.PAID);
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // 获取最近订单
    const recentOrders = await this.prisma.order.findMany({
      where: { userId: id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });

    return {
      ...user,
      stats: {
        totalOrders,
        totalSpent: totalSpent.toFixed(2),
        paidOrders: paidOrders.length,
      },
      recentOrders,
    };
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    this.logger.log(`User status updated: ${id} to ${dto.status}`);
    return updated;
  }

  // ============================================
  // 数据看板
  // ============================================

  /**
   * 获取数据看板统计
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // 尝试从缓存获取
    const cacheKey = 'dashboard:stats';
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 总览统计
    const [totalUsers, totalOrders, totalProducts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.product.count(),
    ]);

    const totalRevenueResult = await this.prisma.order.aggregate({
      where: { status: OrderStatus.PAID },
      _sum: { paidAmount: true },
    });

    const totalRevenue = totalRevenueResult._sum.paidAmount || '0';

    // 今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStart = today;
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [newUsers, newOrdersResult] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: OrderStatus.PAID,
        },
        _count: true,
        _sum: { paidAmount: true },
      }),
    ]);

    // 订单状态统计
    const [pendingCount, paidCount, completedCount, cancelledCount, refundedCount] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
    ]);

    // 低库存产品统计
    const lowStockProducts = await this.prisma.product.count({
      where: {
        stock: {
          lte: 10,
        },
        status: 'PUBLISHED',
      },
    });

    // 返回扁平化的统计数据（前端期望的格式）
    const stats: DashboardStats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue),
      todayOrders: newOrdersResult._count,
      todayRevenue: Number(newOrdersResult._sum.paidAmount || 0),
      pendingOrders: pendingCount,
      paidOrders: paidCount,
      completedOrders: completedCount,
      cancelledOrders: cancelledCount,
      lowStockProducts,
    };

    // 缓存结果（5分钟）
    await this.cache.set(cacheKey, JSON.stringify(stats), 300);

    return stats;
  }

  /**
   * 获取订单统计数据
   */
  async getOrderStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
    });

    // 按日期分组统计
    const dailyStats = new Map<string, { orders: number; revenue: number }>();

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      const existing = dailyStats.get(dateKey) || { orders: 0, revenue: 0 };

      dailyStats.set(dateKey, {
        orders: existing.orders + 1,
        revenue: existing.revenue + (order.status === OrderStatus.PAID ? Number(order.totalAmount) : 0),
      });
    });

    // 生成完整的日期范围
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().slice(0, 10);
      const stats = dailyStats.get(dateKey) || { orders: 0, revenue: 0 };

      result.push({
        date: dateKey,
        orders: stats.orders,
        revenue: stats.revenue.toFixed(2),
      });
    }

    return result;
  }
}
