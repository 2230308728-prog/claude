import api, { ApiResponse, PaginatedResponse } from './api';
import type {
  Coupon,
  CreateCouponDto,
  UpdateCouponDto,
  CouponQuery,
  CouponStats,
  UserCoupon,
} from '@/types';

export const couponService = {
  /**
   * 获取优惠券列表
   */
  async getCoupons(query?: CouponQuery): Promise<PaginatedResponse<Coupon>> {
    const response = await api.get<ApiResponse<Coupon[]>>('/coupons', { params: query });
    return {
      data: response.data.data,
      meta: response.data.meta as any,
    };
  },

  /**
   * 获取优惠券详情
   */
  async getCoupon(id: number): Promise<Coupon> {
    const response = await api.get<ApiResponse<Coupon>>(`/coupons/${id}`);
    return response.data.data;
  },

  /**
   * 获取优惠券统计
   */
  async getCouponStats(id: number): Promise<CouponStats> {
    const response = await api.get<ApiResponse<CouponStats>>(`/coupons/${id}/stats`);
    return response.data.data;
  },

  /**
   * 创建优惠券
   */
  async createCoupon(data: CreateCouponDto): Promise<Coupon> {
    const response = await api.post<ApiResponse<Coupon>>('/coupons', data);
    return response.data.data;
  },

  /**
   * 更新优惠券
   */
  async updateCoupon(id: number, data: UpdateCouponDto): Promise<Coupon> {
    const response = await api.put<ApiResponse<Coupon>>(`/coupons/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除优惠券
   */
  async deleteCoupon(id: number): Promise<void> {
    await api.delete(`/coupons/${id}`);
  },

  /**
   * 获取用户优惠券列表
   */
  async getUserCoupons(status?: string): Promise<UserCoupon[]> {
    const response = await api.get<ApiResponse<UserCoupon[]>>('/coupons/my', {
      params: status ? { status } : undefined,
    });
    return response.data.data;
  },

  /**
   * 领取优惠券
   */
  async claimCoupon(couponId: number): Promise<UserCoupon> {
    const response = await api.post<ApiResponse<UserCoupon>>('/coupons/claim', { couponId });
    return response.data.data;
  },

  /**
   * 使用优惠券
   */
  async useCoupon(couponId: number, orderId: number): Promise<void> {
    await api.post('/coupons/use', { couponId, orderId });
  },
};
