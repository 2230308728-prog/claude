import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取总体统计数据
   */
  async getOverallStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      paidOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: where.createdAt } }),
      this.prisma.product.count({ where: { createdAt: where.createdAt } }),
      this.prisma.order.count({ where: { ...where, status: { not: OrderStatus.CANCELLED } } }),
      this.prisma.order.aggregate({
        where: { ...where, status: OrderStatus.PAID },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      paidOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
    };
  }

  /**
   * 获取销售报表数据
   */
  async getSalesReport(startDate: Date, endDate: Date, groupBy: string = 'day') {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 根据groupBy进行分组
    const groupedData: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      let key: string;

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, orders: 0 };
      }

      groupedData[key].revenue += Number(order.totalAmount);
      groupedData[key].orders += 1;
    });

    // 转换为数组格式
    return Object.entries(groupedData).map(([date, data]) => ({
      date,
      revenue: Number(data.revenue.toFixed(2)),
      orders: data.orders,
    }));
  }

  /**
   * 获取产品销量排行
   */
  async getProductRanking(limit: number = 10, startDate?: Date, endDate?: Date) {
    const orderWhere: any = {
      status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] },
    };

    if (startDate && endDate) {
      orderWhere.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const products = await this.prisma.product.findMany({
      include: {
        orders: {
          where: orderWhere,
          select: {
            totalAmount: true,
            participantCount: true,
          },
        },
      },
      orderBy: {
        orders: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return products.map((product) => {
      const totalRevenue = product.orders.reduce(
        (sum: number, order: any) => sum + Number(order.totalAmount),
        0,
      );
      const totalSales = product.orders.reduce(
        (sum: number, order: any) => sum + (order.participantCount || 1),
        0,
      );

      return {
        id: product.id,
        title: product.title,
        price: Number(product.price),
        images: product.images,
        orderCount: product.orders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalSales,
      };
    });
  }

  /**
   * 获取用户统计数据
   */
  async getUserStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where }),
      this.prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: where.createdAt,
            },
          },
        },
      }),
    ]);

    // 按日期统计新增用户
    const userGrowth = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        ...(startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formattedUserGrowth = userGrowth.map((item) => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count.id,
    }));

    return {
      totalUsers,
      newUsers,
      activeUsers,
      userGrowth: formattedUserGrowth,
    };
  }

  /**
   * 获取订单状态分布
   */
  async getOrderStatusDistribution(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return orders.map((item) => ({
      status: item.status,
      count: item._count.id,
      amount: Number(item._sum.totalAmount || 0),
    }));
  }
}
