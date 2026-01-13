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
import { refundService } from '@/services/refund.service';
import type { Refund, RefundQuery, RefundStatus } from '@/types';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<RefundQuery>({
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');

  useEffect(() => {
    loadRefunds();
  }, [query, statusFilter]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const data = await refundService.getRefunds({
        ...query,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
      });
      setRefunds(data.data);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, page: 1 });
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

  const handleApprove = async (id: number) => {
    const reason = prompt('请输入审核通过原因（可选）:');
    if (reason === null) return; // 用户取消

    try {
      await refundService.processRefund(id, 'APPROVED', reason || undefined);
      loadRefunds();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('请输入拒绝原因（必填）:');
    if (!reason) {
      alert('请输入拒绝原因');
      return;
    }

    try {
      await refundService.processRefund(id, 'REJECTED', reason);
      loadRefunds();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('确认退款已完成？')) return;

    try {
      await refundService.processRefund(id, 'COMPLETED', '退款已完成');
      loadRefunds();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">退款管理</h1>
            <p className="text-gray-500 mt-1">处理用户的退款申请</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>退款列表</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="PENDING">待审核</option>
                  <option value="APPROVED">已批准</option>
                  <option value="REJECTED">已拒绝</option>
                  <option value="COMPLETED">已完成</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索订单号/用户..."
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
                      <TableHead>退款单号</TableHead>
                      <TableHead>订单号</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>退款金额</TableHead>
                      <TableHead>退款原因</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>申请时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="font-mono text-sm">{refund.refundNo}</TableCell>
                        <TableCell className="font-mono text-sm">{refund.order?.orderNo || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{refund.user?.nickname || refund.user?.phone || '-'}</div>
                            <div className="text-xs text-gray-500">{refund.user?.phone || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">¥{refund.amount}</TableCell>
                        <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell className="text-sm">{formatDate(refund.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {refund.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(refund.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  通过
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReject(refund.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  拒绝
                                </Button>
                              </>
                            )}
                            {refund.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                onClick={() => handleComplete(refund.id)}
                              >
                                完成退款
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/refunds/${refund.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {refunds.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          暂无退款记录
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
                        disabled={refunds.length < (query.pageSize || 20)}
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
