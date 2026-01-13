'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { orderService } from '@/services/order.service';
import { exportToExcel, exportToCSV } from '@/lib/export';
import type { Order, OrderQuery, OrderStatus } from '@/types';
import { Search, Eye, Download } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<OrderQuery>({
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, [query, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders({
        ...query,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
      });
      setOrders(data.data);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOrdersForExport = async () => {
    try {
      const data = await orderService.getOrders({
        ...query,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
        pageSize: 1000, // 获取更多数据用于导出
      });
      setAllOrders(data.data);
    } catch (error) {
      console.error('Failed to load orders for export:', error);
    }
  };

  const handleExport = async (format: 'excel' | 'csv' = 'excel') => {
    await loadAllOrdersForExport();

    if (allOrders.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const exportData = allOrders.map((order) => ({
      订单号: order.orderNo,
      产品: order.product?.title || '',
      联系人: order.contactName,
      电话: order.contactPhone,
      参与人: order.participantName,
      年龄: order.participantAge,
      出行日期: order.travelDate || '',
      金额: order.totalAmount,
      状态: order.status,
      下单时间: new Date(order.createdAt).toLocaleString('zh-CN'),
      支付时间: order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '',
    }));

    const filename = `订单列表_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'excel') {
      exportToExcel(exportData, filename);
    } else {
      exportToCSV(exportData, filename);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, page: 1 });
  };

  const getStatusBadge = (status: OrderStatus) => {
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
            <p className="text-gray-500 mt-1">查看和管理所有订单</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              导出 CSV
            </Button>
            <Button onClick={() => handleExport('excel')}>
              <Download className="mr-2 h-4 w-4" />
              导出 Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>订单列表</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="PENDING">待支付</option>
                  <option value="PAID">已支付</option>
                  <option value="CONFIRMED">已确认</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                  <option value="REFUNDED">已退款</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索订单号/联系人..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 w-64"
                  />
                </div>
                <Button onClick={handleSearch} variant="outline">
                  搜索
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>产品</TableHead>
                      <TableHead>联系人</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>出行日期</TableHead>
                      <TableHead>下单时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.orderNo}</TableCell>
                        <TableCell>{order.product?.title || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.contactName}</div>
                            <div className="text-xs text-gray-500">{order.contactPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">¥{order.totalAmount}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.travelDate ? new Date(order.travelDate).toLocaleDateString('zh-CN') : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          暂无订单数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {total > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      共 {total} 条记录
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={query.page === 1}
                        onClick={() => setQuery({ ...query, page: (query.page || 1) - 1 })}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={orders.length < (query.pageSize || 20)}
                        onClick={() => setQuery({ ...query, page: (query.page || 1) + 1 })}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
