import api, { ApiResponse } from './api';
import type { LoginRequest, AuthResponse, User } from '@/types';

export const authService = {
  /**
   * 管理员登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/admin/login', data);
    return response.data.data;
  },

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
