'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { refundService } from '@/services/refund.service';
import type { Refund, RefundStatus } from '@/types';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function RefundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const refundId = Number(params.id);
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (refundId) {
      loadRefund();
    }
  }, [refundId]);

  const loadRefund = async () => {
    try {
      setLoading(true);
      const data = await refundService.getRefund(refundId);
      setRefund(data);
    } catch (error) {
      console.error('Failed to load refund:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: RefundStatus) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      PENDING: 'warning',
      APPROVED: 'default',
      REJECTED: 'destructive',
      COMPLETED: 'success',
    };
    const labels: Record<string, string> = {
      PENDING: '待审核',
      APPROVED: '已批准',
      REJECTED: '已拒绝',
      COMPLETED: '已完成',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const handleApprove = async () => {
    const reason = prompt('请输入审核通过原因（可选）:');
    if (reason === null) return;

    try {
      await refundService.processRefund(refundId, 'APPROVED', reason || undefined);
      loadRefund();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async () => {
    const reason = prompt('请输入拒绝原因（必填）:');
    if (!reason) {
      alert('请输入拒绝原因');
      return;
    }

    try {
      await refundService.processRefund(refundId, 'REJECTED', reason);
      loadRefund();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleComplete = async () => {
    if (!confirm('确认退款已完成？')) return;

    try {
      await refundService.processRefund(refundId, 'COMPLETED', '退款已完成');
      loadRefund();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">加载中...</div>
      </DashboardLayout>
    );
  }

  if (!refund) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">退款单不存在</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">退款详情</h1>
            <p className="text-gray-500 mt-1">退款单号: {refund.refundNo}</p>
          </div>
        </div>

        {/* 状态卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>退款状态</CardTitle>
              {getStatusBadge(refund.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">退款金额</div>
                <div className="text-2xl font-bold text-red-600">¥{refund.amount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">申请时间</div>
                <div className="text-lg">{formatDate(refund.createdAt)}</div>
              </div>
            </div>
            {refund.processedAt && (
              <div>
                <div className="text-sm text-gray-500">处理时间</div>
                <div>{formatDate(refund.processedAt)}</div>
              </div>
            )}
            {refund.note && (
              <div>
                <div className="text-sm text-gray-500">处理备注</div>
                <div className="mt-1 p-3 bg-gray-50 rounded">{refund.note}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 退款原因 */}
        <Card>
          <CardHeader>
            <CardTitle>退款原因</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">原因:</span>
                <span className="flex-1">{refund.reason}</span>
              </div>
              {refund.description && (
                <div className="flex items-start">
                  <span className="text-sm text-gray-500 w-24">详细说明:</span>
                  <span className="flex-1">{refund.description}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 订单信息 */}
        <Card>
          <CardHeader>
            <CardTitle>订单信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">订单号:</span>
                <span className="font-mono">{refund.order?.orderNo || '-'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">产品:</span>
                <span className="flex-1">{refund.order?.product?.title || '-'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">订单金额:</span>
                <span className="font-medium">¥{refund.order?.totalAmount || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户信息 */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">昵称:</span>
                <span className="flex-1">{refund.user?.nickname || '-'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">手机号:</span>
                <span className="font-mono">{refund.user?.phone || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          {refund.status === 'PENDING' && (
            <>
              <Button onClick={handleApprove} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                审核通过
              </Button>
              <Button onClick={handleReject} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                拒绝退款
              </Button>
            </>
          )}
          {refund.status === 'APPROVED' && (
            <Button onClick={handleComplete} className="flex-1">
              完成退款
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
