import api, { ApiResponse, PaginatedResponse } from './api';
import type {
  Review,
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQuery,
  ReviewStats,
} from '@/types';

export const reviewService = {
  /**
   * 获取评价列表
   */
  async getReviews(query?: ReviewQuery): Promise<PaginatedResponse<Review>> {
    const response = await api.get<ApiResponse<Review[]>>('/reviews', { params: query });
    return {
      data: response.data.data,
      meta: response.data.meta as any,
    };
  },

  /**
   * 获取评价详情
   */
  async getReview(id: number): Promise<Review> {
    const response = await api.get<ApiResponse<Review>>(`/reviews/${id}`);
    return response.data.data;
  },

  /**
   * 获取产品评价统计
   */
  async getProductStats(productId: number): Promise<ReviewStats> {
    const response = await api.get<ApiResponse<ReviewStats>>(`/reviews/product/${productId}/stats`);
    return response.data.data;
  },

  /**
   * 创建评价
   */
  async createReview(data: CreateReviewDto): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>('/reviews', data);
    return response.data.data;
  },

  /**
   * 更新评价
   */
  async updateReview(id: number, data: UpdateReviewDto): Promise<Review> {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除评价
   */
  async deleteReview(id: number): Promise<void> {
    await api.delete(`/reviews/${id}`);
  },

  /**
   * 管理员回复评价
   */
  async adminReply(id: number, reply: string): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>(`/reviews/${id}/reply`, { reply });
    return response.data.data;
  },

  /**
   * 审核评价
   */
  async approveReview(id: number, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>(`/reviews/${id}/approve`, {
      status,
      reason,
    });
    return response.data.data;
  },

  /**
   * 管理员删除评价
   */
  async adminDeleteReview(id: number): Promise<void> {
    await api.delete(`/reviews/${id}/admin`);
  },

  /**
   * 获取待审核评价数量
   */
  async getPendingCount(): Promise<{ count: number }> {
    const response = await api.get<ApiResponse<{ count: number }>>('/reviews/pending/count');
    return response.data.data;
  },
};
