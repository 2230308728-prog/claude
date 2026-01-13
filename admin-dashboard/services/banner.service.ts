import api from './api';
import type { Banner, BannerQuery, CreateBannerDto, UpdateBannerDto, PaginatedResponse } from '@/types';

export const bannerService = {
  /**
   * 获取轮播图列表
   */
  async getBanners(query?: BannerQuery): Promise<PaginatedResponse<Banner>> {
    const response = await api.get<{ data: Banner[]; meta: { total: number } }>('/banners', {
      params: query,
    });
    return {
      data: response.data.data,
      meta: response.data.meta as any,
    };
  },

  /**
   * 获取启用的轮播图列表（供前端使用）
   */
  async getEnabledBanners(): Promise<Banner[]> {
    const response = await api.get<Banner[]>('/banners/list');
    return response.data;
  },

  /**
   * 获取轮播图详情
   */
  async getBanner(id: number): Promise<Banner> {
    const response = await api.get<Banner>(`/banners/${id}`);
    return response.data;
  },

  /**
   * 创建轮播图
   */
  async createBanner(data: CreateBannerDto): Promise<Banner> {
    const response = await api.post<Banner>('/banners', data);
    return response.data;
  },

  /**
   * 更新轮播图
   */
  async updateBanner(id: number, data: UpdateBannerDto): Promise<Banner> {
    const response = await api.put<Banner>(`/banners/${id}`, data);
    return response.data;
  },

  /**
   * 删除轮播图
   */
  async deleteBanner(id: number): Promise<void> {
    await api.delete(`/banners/${id}`);
  },

  /**
   * 切换启用状态
   */
  async toggleEnabled(id: number): Promise<Banner> {
    const response = await api.post<Banner>(`/banners/${id}/toggle`);
    return response.data;
  },
};
