import api from './api';
import type { Refund, RefundQuery, CreateRefundDto, ProcessRefundDto } from '@/types';

class RefundService {
  async getRefunds(query?: RefundQuery) {
    const response = await api.get<{ data: Refund[]; meta: { total: number } }>('/refunds', {
      params: query,
    });
    return response.data;
  }

  async getRefund(id: number) {
    const response = await api.get<Refund>(`/refunds/${id}`);
    return response.data;
  }

  async createRefund(data: CreateRefundDto) {
    const response = await api.post<Refund>('/refunds', data);
    return response.data;
  }

  async processRefund(id: number, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', note?: string) {
    const response = await api.put<Refund>(`/refunds/${id}/process`, { status, note });
    return response.data;
  }
}

export const refundService = new RefundService();
