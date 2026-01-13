import api, { ApiResponse, PaginatedResponse } from './api';
import type { User } from '@/types';

export const userService = {
  /**
   * 获取用户列表
   */
  async getUsers(params?: { page?: number; pageSize?: number; keyword?: string; role?: string }): Promise<PaginatedResponse<User>> {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return {
      data: response.data.data,
      meta: response.data.meta as any,
    };
  },

  /**
   * 获取用户详情
   */
  async getUser(id: number): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  /**
   * 更新用户状态
   */
  async updateUserStatus(id: number, status: string): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * 删除用户
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
