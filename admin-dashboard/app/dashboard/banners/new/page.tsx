'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { bannerService } from '@/services/banner.service';
import type { CreateBannerDto } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBannerDto>({
    title: '',
    imageUrl: '',
    linkUrl: '',
    linkType: 'none',
    productId: undefined,
    categoryId: undefined,
    sortOrder: 0,
    isEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('请输入轮播图标题');
      return;
    }

    if (!formData.imageUrl.trim()) {
      alert('请输入图片URL');
      return;
    }

    try {
      setLoading(true);
      await bannerService.createBanner(formData);
      alert('创建成功！');
      router.push('/dashboard/banners');
    } catch (error) {
      console.error('Failed to create banner:', error);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">新建轮播图</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入轮播图标题"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">图片URL *</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="请输入图片URL"
                  required
                />
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkType">链接类型</Label>
                <select
                  id="linkType"
                  value={formData.linkType}
                  onChange={(e) => setFormData({ ...formData, linkType: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-md border"
                >
                  <option value="none">无链接</option>
                  <option value="product">产品</option>
                  <option value="category">分类</option>
                  <option value="url">外部链接</option>
                  <option value="mini_program">小程序</option>
                </select>
              </div>

              {formData.linkType === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">链接URL</Label>
                  <Input
                    id="linkUrl"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="请输入链接URL"
                  />
                </div>
              )}

              {formData.linkType === 'product' && (
                <div className="space-y-2">
                  <Label htmlFor="productId">产品ID</Label>
                  <Input
                    id="productId"
                    type="number"
                    value={formData.productId || ''}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="请输入产品ID"
                  />
                </div>
              )}

              {formData.linkType === 'category' && (
                <div className="space-y-2">
                  <Label htmlFor="categoryId">分类ID</Label>
                  <Input
                    id="categoryId"
                    type="number"
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="请输入分类ID"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sortOrder">排序（数字越小越靠前）</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isEnabled">启用状态</Label>
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? '保存中...' : '保存'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
