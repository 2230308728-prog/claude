'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { couponService } from '@/services/coupon.service';
import type { Coupon, UpdateCouponDto } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateCouponDto>({});

  useEffect(() => {
    loadCoupon();
  }, [id]);

  const loadCoupon = async () => {
    try {
      setLoading(true);
      const data = await couponService.getCoupon(id);
      setCoupon(data);
      setFormData({
        name: data.name,
        description: data.description,
        value: data.value,
        minAmount: data.minAmount,
        maxDiscount: data.maxDiscount,
        isEnabled: data.isEnabled,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || '加载失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (formData.value !== undefined && formData.value <= 0) {
      alert('折扣值必须大于 0');
      return;
    }
    if (formData.minAmount !== undefined && formData.minAmount <= 0) {
      alert('最低消费金额必须大于 0');
      return;
    }
    if (formData.maxDiscount !== undefined && formData.maxDiscount <= 0) {
      alert('最大优惠金额必须大于 0');
      return;
    }

    try {
      setSaving(true);
      await couponService.updateCoupon(id, formData);
      router.push('/dashboard/coupons');
    } catch (error: any) {
      alert(error.response?.data?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">加载中...</div>
      </DashboardLayout>
    );
  }

  if (!coupon) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">优惠券不存在</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">编辑优惠券</h1>
            <p className="text-gray-500 mt-1">修改优惠券信息</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>优惠券信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 只读信息 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">优惠券类型</div>
                <div className="font-medium">
                  {coupon.type === 'PERCENT' ? '百分比折扣' : '固定金额'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">当前折扣值</div>
                <div className="font-medium">
                  {coupon.type === 'PERCENT' ? `${coupon.value} 折` : `¥${coupon.value}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">发行数量</div>
                <div className="font-medium">{coupon.totalQuantity}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">已领取</div>
                <div className="font-medium">{coupon.claimedQuantity}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">有效期</div>
                <div className="font-medium">
                  {new Date(coupon.validFrom).toLocaleString('zh-CN')} ~ {new Date(coupon.validUntil).toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">每人限领</div>
                <div className="font-medium">{coupon.limitPerUser} 张</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 优惠券名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券名称
                </label>
                <Input
                  placeholder="优惠券名称"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券描述
                </label>
                <textarea
                  placeholder="优惠券使用说明"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 折扣值 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {coupon.type === 'PERCENT' ? '折扣百分比' : '折扣金额'}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.value !== undefined ? formData.value : coupon.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    min={0}
                    max={coupon.type === 'PERCENT' ? 100 : undefined}
                    step={0.1}
                  />
                  <span className="text-gray-500">
                    {coupon.type === 'PERCENT' ? '折' : '元'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  注意：修改折扣值会影响已领取但未使用的优惠券
                </p>
              </div>

              {/* 最低消费金额 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最低消费金额
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0 表示无限制"
                    value={formData.minAmount !== undefined ? formData.minAmount : coupon.minAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="text-gray-500">元</span>
                </div>
              </div>

              {/* 最大优惠金额 */}
              {coupon.type === 'PERCENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大优惠金额
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="不填则不限制"
                      value={formData.maxDiscount !== undefined ? formData.maxDiscount : coupon.maxDiscount || ''}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || undefined })}
                      min={0}
                      step={0.01}
                    />
                    <span className="text-gray-500">元</span>
                  </div>
                </div>
              )}

              {/* 是否启用 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={formData.isEnabled !== undefined ? formData.isEnabled : coupon.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
                  启用优惠券
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  取消
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存修改'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
