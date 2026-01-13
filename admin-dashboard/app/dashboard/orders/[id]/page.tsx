'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types';
import { ArrowLeft, User, Package, Phone, Mail, Calendar } from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      router.push('/dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      PENDING: 'secondary',
      PAID: 'default',
      CONFIRMED: 'success',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
      REFUNDED: 'warning',
    };
    const labels: Record<string, string> = {
      PENDING: '待支付',
      PAID: '已支付',
      CONFIRMED: '已确认',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-lg">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-lg text-gray-500">订单不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/orders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">订单详情</h1>
            <p className="text-gray-500 mt-1">订单号: {order.orderNo}</p>
          </div>
          <div className="ml-auto">{getStatusBadge(order.status)}</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 产品信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                产品信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">产品名称</p>
                <p className="font-semibold text-lg">{order.product?.title || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">单价</p>
                  <p className="font-medium">¥{order.product?.price || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">产品分类</p>
                  <p className="font-medium">{order.product?.category?.name || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 订单金额 */}
          <Card>
            <CardHeader>
              <CardTitle>订单金额</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">总金额</span>
                <span className="text-2xl font-bold text-gray-900">¥{order.totalAmount}</span>
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">支付时间</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">确认时间</span>
                  <span>{formatDate(order.confirmedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">完成时间</span>
                  <span>{formatDate(order.completedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 联系人信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                联系人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">联系人</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {order.contactName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {order.contactPhone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 参与人信息 */}
          <Card>
            <CardHeader>
              <CardTitle>参与人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">姓名</p>
                  <p className="font-medium">{order.participantName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">年龄</p>
                  <p className="font-medium">{order.participantAge} 岁</p>
                </div>
              </div>
              {order.travelDate && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    出行日期
                  </p>
                  <p className="font-medium">{new Date(order.travelDate).toLocaleDateString('zh-CN')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 用户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                用户信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">用户 ID</p>
                <p className="font-mono text-sm">{order.user?.id || order.userId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">{order.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">昵称</p>
                <p className="font-medium">{order.user?.nickname || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 订单时间线 */}
          <Card>
            <CardHeader>
              <CardTitle>订单时间线</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">更新时间</p>
                <p className="font-medium">{formatDate(order.updatedAt)}</p>
              </div>
              {order.cancelledAt && (
                <div>
                  <p className="text-sm text-gray-500">取消时间</p>
                  <p className="font-medium">{formatDate(order.cancelledAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 备注 */}
        {order.remarks && (
          <Card>
            <CardHeader>
              <CardTitle>备注</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{order.remarks}</p>
            </CardContent>
          </Card>
        )}

        {/* 退款原因 */}
        {order.refundReason && (
          <Card>
            <CardHeader>
              <CardTitle>退款原因</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{order.refundReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
