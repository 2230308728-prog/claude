'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { couponService } from '@/services/coupon.service';
import type { Coupon, CouponStats } from '@/types';
import { ArrowLeft, Edit, Users, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

export default function CouponDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponData, statsData] = await Promise.all([
        couponService.getCoupon(id),
        couponService.getCouponStats(id),
      ]);
      setCoupon(couponData);
      setStats(statsData);
    } catch (error: any) {
      alert(error.response?.data?.message || '加载失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!coupon) return null;
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isEnabled) {
      return <Badge variant="secondary">已停用</Badge>;
    }
    if (now < validFrom) {
      return <Badge variant="secondary">未开始</Badge>;
    }
    if (now > validUntil) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    if (coupon.claimedQuantity >= coupon.totalQuantity) {
      return <Badge variant="destructive">已领完</Badge>;
    }
    return <Badge variant="default">进行中</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">加载中...</div>
      </DashboardLayout>
    );
  }

  if (!coupon || !stats) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">优惠券不存在</div>
      </DashboardLayout>
    );
  }

  const claimedPercent = (coupon.claimedQuantity / coupon.totalQuantity) * 100;
  const usedPercent = stats.totalClaims > 0 ? (stats.usedCount / stats.totalClaims) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{coupon.name}</h1>
              <p className="text-gray-500 mt-1">{coupon.description || '无描述'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <Button onClick={() => router.push(`/dashboard/coupons/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </div>
        </div>

        {/* 优惠券基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">优惠券类型</div>
                <div className="text-lg font-semibold">
                  {coupon.type === 'PERCENT' ? '百分比折扣' : '固定金额'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">折扣值</div>
                <div className="text-lg font-semibold">
                  {coupon.type === 'PERCENT' ? `${coupon.value} 折` : `¥${coupon.value}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">最低消费</div>
                <div className="text-lg font-semibold">
                  {coupon.minAmount ? `¥${coupon.minAmount}` : '无限制'}
                </div>
              </div>
              {coupon.type === 'PERCENT' && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">最大优惠</div>
                  <div className="text-lg font-semibold">
                    {coupon.maxDiscount ? `¥${coupon.maxDiscount}` : '无限制'}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 mb-1">发行数量</div>
                <div className="text-lg font-semibold">{coupon.totalQuantity} 张</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">每人限领</div>
                <div className="text-lg font-semibold">{coupon.limitPerUser} 张</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">有效期开始</div>
                <div className="text-lg font-semibold">
                  {new Date(coupon.validFrom).toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">有效期结束</div>
                <div className="text-lg font-semibold">
                  {new Date(coupon.validUntil).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总领取数</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalClaims}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  已领取 {claimedPercent.toFixed(1)}%
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(claimedPercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已使用</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.usedCount}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500">
                  使用率 {usedPercent.toFixed(1)}%
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">可用数量</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.availableCount}</div>
              <div className="text-xs text-gray-500 mt-2">
                已过期 {stats.expiredCount} 张
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总优惠金额</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">¥{stats.totalDiscount.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-2">
                平均订单 ¥{stats.avgOrderValue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 领取和使用趋势 */}
        {stats.claimsByDate && stats.claimsByDate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>领取趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.claimsByDate.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500">{item.date}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min((item.count / Math.max(...stats.claimsByDate.map(d => d.count))) * 100, 100)}%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats.usageByDate && stats.usageByDate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>使用趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.usageByDate.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500">{item.date}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6">
                      <div
                        className="bg-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min((item.count / Math.max(...stats.usageByDate.map(d => d.count))) * 100, 100)}%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
