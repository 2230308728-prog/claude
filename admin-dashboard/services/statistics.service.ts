import api from './api';

export interface OverviewStatistics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
}

export interface SalesReportItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductRankingItem {
  id: number;
  title: string;
  price: number;
  images: string[];
  orderCount: number;
  totalRevenue: number;
  totalSales: number;
}

export interface UserStatistics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  userGrowth: Array<{ date: string; count: number }>;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
  amount: number;
}

class StatisticsService {
  async getOverview(params?: { range?: string; startDate?: string; endDate?: string }) {
    return api.get<OverviewStatistics>('/statistics/overview', { params });
  }

  async getSalesReport(params?: { startDate?: string; endDate?: string; groupBy?: string }) {
    return api.get<SalesReportItem[]>('/statistics/sales', { params });
  }

  async getProductRanking(params?: { startDate?: string; endDate?: string; limit?: number }) {
    return api.get<ProductRankingItem[]>('/statistics/products', { params });
  }

  async getUserStatistics(params?: { startDate?: string; endDate?: string }) {
    return api.get<UserStatistics>('/statistics/users', { params });
  }

  async getOrderStatusDistribution(params?: { startDate?: string; endDate?: string }) {
    return api.get<OrderStatusDistribution[]>('/statistics/orders', { params });
  }
}

export const statisticsService = new StatisticsService();
