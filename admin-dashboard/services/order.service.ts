import api, { ApiResponse, PaginatedResponse } from './api';
import type { Order, OrderQuery, DashboardStats, OrderStat } from '@/types';

export const orderService = {
  /**
   * 获取订单列表
   */
  async getOrders(query?: OrderQuery): Promise<PaginatedResponse<Order>> {
    const response = await api.get<ApiResponse<Order[]>>('/orders', { params: query });
    return {
      data: response.data.data,
      meta: response.data.meta as any,
    };
  },

  /**
   * 获取订单详情
   */
  async getOrder(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  /**
   * 更新订单状态
   */
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * 取消订单
   */
  async cancelOrder(id: number, reason: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  /**
   * 获取统计数据
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/users/dashboard/stats');
    return response.data.data;
  },

  /**
   * 获取订单统计
   */
  async getOrderStats(days: number = 7): Promise<OrderStat[]> {
    const response = await api.get<ApiResponse<OrderStat[]>>('/users/dashboard/order-stats', {
      params: { days },
    });
    return response.data.data;
  },
};
