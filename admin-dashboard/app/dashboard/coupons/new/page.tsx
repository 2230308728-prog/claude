'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { couponService } from '@/services/coupon.service';
import type { CreateCouponDto, CouponType } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCouponDto>({
    name: '',
    description: '',
    type: 'PERCENT',
    value: 10,
    minAmount: 0,
    maxDiscount: undefined,
    totalQuantity: 1000,
    limitPerUser: 1,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    productIds: [],
    categoryIds: [],
    isEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.name) {
      alert('请输入优惠券名称');
      return;
    }
    if (formData.type === 'PERCENT' && (formData.value <= 0 || formData.value > 100)) {
      alert('折扣百分比必须在 0-100 之间');
      return;
    }
    if (formData.type === 'AMOUNT' && formData.value <= 0) {
      alert('折扣金额必须大于 0');
      return;
    }
    if (formData.minAmount && formData.minAmount <= 0) {
      alert('最低消费金额必须大于 0');
      return;
    }
    if (formData.totalQuantity <= 0) {
      alert('发行数量必须大于 0');
      return;
    }
    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      alert('有效期结束时间必须大于开始时间');
      return;
    }
    if (formData.type === 'PERCENT' && formData.maxDiscount && formData.maxDiscount <= 0) {
      alert('最大优惠金额必须大于 0');
      return;
    }

    try {
      setLoading(true);
      await couponService.createCoupon(formData);
      router.push('/dashboard/coupons');
    } catch (error: any) {
      alert(error.response?.data?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">新建优惠券</h1>
            <p className="text-gray-500 mt-1">创建新的优惠券</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 优惠券名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="例如：新用户专享优惠"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券描述
                </label>
                <textarea
                  placeholder="优惠券使用说明"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 优惠券类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PERCENT">百分比折扣</option>
                  <option value="AMOUNT">固定金额</option>
                </select>
              </div>

              {/* 折扣值 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'PERCENT' ? '折扣百分比' : '折扣金额'} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder={formData.type === 'PERCENT' ? '例如：8.5 表示 8.5 折' : '例如：50'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={formData.type === 'PERCENT' ? 100 : undefined}
                    step={0.1}
                    required
                  />
                  <span className="text-gray-500">
                    {formData.type === 'PERCENT' ? '折' : '元'}
                  </span>
                </div>
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
                    value={formData.minAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="text-gray-500">元</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">订单金额需达到此金额才可使用优惠券</p>
              </div>

              {/* 最大优惠金额 */}
              {formData.type === 'PERCENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大优惠金额
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="不填则不限制"
                      value={formData.maxDiscount || ''}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || undefined })}
                      min={0}
                      step={0.01}
                    />
                    <span className="text-gray-500">元</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">使用百分比折扣时的最大优惠金额</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>发行设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 发行数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  发行数量 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="例如：1000"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
                  min={1}
                  required
                />
              </div>

              {/* 每人限领 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  每人限领数量
                </label>
                <Input
                  type="number"
                  placeholder="默认为 1"
                  value={formData.limitPerUser || 1}
                  onChange={(e) => setFormData({ ...formData, limitPerUser: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>

              {/* 有效期 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期开始 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期结束 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 是否启用 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
                  立即启用
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '创建中...' : '创建优惠券'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
