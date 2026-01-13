'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { orderService } from '@/services/order.service';
import type { DashboardStats, OrderStat } from '@/types';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, orderStatsData] = await Promise.all([
        orderService.getDashboardStats(),
        orderService.getOrderStats(7),
      ]);
      setStats(statsData);
      setOrderStats(orderStatsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">首页</h1>
          <p className="text-gray-500 mt-1">欢迎回来，查看您的业务数据概览</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="总用户数"
            value={stats?.totalUsers || 0}
            icon={Users}
            description="注册用户总数"
          />
          <StatCard
            title="总产品数"
            value={stats?.totalProducts || 0}
            icon={Package}
            description="在售产品总数"
          />
          <StatCard
            title="总订单数"
            value={stats?.totalOrders || 0}
            icon={ShoppingCart}
            description="历史订单总数"
          />
          <StatCard
            title="总收入"
            value={`¥${((stats?.totalRevenue || 0) / 100).toFixed(2)}`}
            icon={DollarSign}
            description="累计收入金额"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="今日订单"
            value={stats?.todayOrders || 0}
            icon={ShoppingCart}
            description="今日新增订单"
          />
          <StatCard
            title="今日收入"
            value={`¥${((stats?.todayRevenue || 0) / 100).toFixed(2)}`}
            icon={DollarSign}
            description="今日收入金额"
          />
          <StatCard
            title="待处理订单"
            value={stats?.pendingOrders || 0}
            icon={TrendingUp}
            description="需要处理的订单"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="库存预警"
            value={stats?.lowStockProducts || 0}
            icon={Package}
            description="低库存产品数"
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        {/* Recent Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>最近7天订单趋势</CardTitle>
            <CardDescription>显示过去一周的订单量和收入变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {orderStats.map((stat, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full text-center text-xs text-gray-500">
                    {stat.orders}
                  </div>
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{
                      height: `${Math.max(
                        (stat.orders / Math.max(...orderStats.map((s) => s.orders))) * 100,
                        5
                      )}%`,
                    }}
                  />
                  <div className="w-full text-center text-xs text-gray-500">
                    {new Date(stat.date).slice(5)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
