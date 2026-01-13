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
import { couponService } from '@/services/coupon.service';
import type { Coupon, CouponQuery, CouponStatus } from '@/types';
import { Search, Plus, Edit, Trash2, BarChart3 } from 'lucide-react';

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<CouponQuery>({
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | ''>('');

  useEffect(() => {
    loadCoupons();
  }, [query, statusFilter]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponService.getCoupons({
        ...query,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
      });
      setCoupons(data.data);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, page: 1 });
  };

  const getStatusBadge = (coupon: Coupon) => {
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

  const getTypeBadge = (type: string) => {
    return type === 'PERCENT' ? (
      <Badge variant="secondary">百分比</Badge>
    ) : (
      <Badge variant="default">固定金额</Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此优惠券吗？')) return;

    try {
      await couponService.deleteCoupon(id);
      loadCoupons();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await couponService.updateCoupon(coupon.id, {
        isEnabled: !coupon.isEnabled,
      });
      loadCoupons();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const getClaimProgress = (coupon: Coupon) => {
    const percentage = (coupon.claimedQuantity / coupon.totalQuantity) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">优惠券管理</h1>
            <p className="text-gray-500 mt-1">创建和管理优惠券</p>
          </div>
          <Button onClick={() => router.push('/dashboard/coupons/new')}>
            <Plus className="h-4 w-4 mr-2" />
            新建优惠券
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>优惠券列表</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CouponStatus | '')}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="ACTIVE">进行中</option>
                  <option value="EXPIRED">已过期</option>
                  <option value="DISABLED">已停用</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索优惠券名称..."
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
                      <TableHead>优惠券名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>折扣</TableHead>
                      <TableHead>有效期</TableHead>
                      <TableHead>领取进度</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{coupon.name}</div>
                            {coupon.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {coupon.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {coupon.type === 'PERCENT' ? (
                              <>{coupon.value}折</>
                            ) : (
                              <>¥{coupon.value}</>
                            )}
                          </div>
                          {coupon.minAmount && (
                            <div className="text-xs text-gray-500">
                              满¥{coupon.minAmount}可用
                            </div>
                          )}
                          {coupon.maxDiscount && coupon.type === 'PERCENT' && (
                            <div className="text-xs text-gray-500">
                              最高优惠¥{coupon.maxDiscount}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(coupon.validFrom).split(' ')[0]}</div>
                            <div className="text-gray-500">至 {formatDate(coupon.validUntil).split(' ')[0]}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="text-sm mb-1">
                              {coupon.claimedQuantity} / {coupon.totalQuantity}
                            </div>
                            {getClaimProgress(coupon)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(coupon)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/coupons/${coupon.id}`)}
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              统计
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/coupons/${coupon.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggle(coupon)}
                            >
                              {coupon.isEnabled ? '停用' : '启用'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(coupon.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {coupons.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          暂无优惠券
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
                        disabled={coupons.length < (query.pageSize || 20)}
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
