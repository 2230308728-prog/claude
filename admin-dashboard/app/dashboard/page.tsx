'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { orderService } from '@/services/order.service';
import type { DashboardStats, OrderStat } from '@/types';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, orderStatsData] = await Promise.all([
        orderService.getDashboardStats(),
        orderService.getOrderStats(selectedPeriod),
      ]);
      setStats(statsData);
      setOrderStats(orderStatsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 准备图表数据
  const chartData = orderStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    orders: stat.orders,
    revenue: Number(stat.revenue) / 100,
    revenueDisplay: `¥${(Number(stat.revenue) / 100).toFixed(0)}`,
  }));

  // 订单状态分布数据（模拟数据，实际应该从后端获取）
  const statusDistribution = [
    { name: '待支付', value: stats?.pendingOrders || 0, color: '#f59e0b' },
    { name: '已支付', value: stats?.paidOrders || 0, color: '#3b82f6' },
    { name: '已完成', value: stats?.completedOrders || 0, color: '#10b981' },
    { name: '已取消', value: stats?.cancelledOrders || 0, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-lg">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">数据概览</h1>
            <p className="text-gray-500 mt-1">查看您的业务数据和分析报告</p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === days
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days}天
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="总收入"
            value={`¥${totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            description={`${selectedPeriod}天收入`}
            trend={
              totalRevenue > 0
                ? { value: Math.round((totalRevenue / (selectedPeriod * 1000)) * 100), isPositive: true }
                : undefined
            }
          />
          <StatCard
            title="总订单数"
            value={totalOrders}
            icon={ShoppingCart}
            description={`${selectedPeriod}天订单`}
          />
          <StatCard
            title="平均客单价"
            value={`¥${avgOrderValue.toFixed(2)}`}
            icon={TrendingUp}
            description="每单平均金额"
          />
          <StatCard
            title="完成率"
            value={`${
              stats?.totalOrders && stats?.totalOrders > 0
                ? Math.round(((stats.completedOrders || 0) / stats.totalOrders) * 100)
                : 0
            }%`}
            icon={Activity}
            description="订单完成比例"
          />
        </div>

        {/* Secondary Stats Cards */}
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
            title="待处理订单"
            value={stats?.pendingOrders || 0}
            icon={ShoppingCart}
            description="需要处理的订单"
          />
          <StatCard
            title="库存预警"
            value={stats?.lowStockProducts || 0}
            icon={Package}
            description="低库存产品数"
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>订单趋势</CardTitle>
              <CardDescription>过去{selectedPeriod}天的订单数量变化</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <YAxis
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="订单数"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>收入趋势</CardTitle>
              <CardDescription>过去{selectedPeriod}天的收入变化（元）</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <YAxis
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '收入']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="收入"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>订单状态分布</CardTitle>
              <CardDescription>各状态订单数量占比</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-400">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Revenue Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>每日订单和收入</CardTitle>
              <CardDescription>订单数量与收入的对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <YAxis
                    yAxisId="left"
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    style={{ fontSize: '12px', fill: '#666' }}
                    stroke="#ccc"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="订单数" radius={[8, 8, 0, 0]} />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    fill="#10b981"
                    name="收入（元）"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
