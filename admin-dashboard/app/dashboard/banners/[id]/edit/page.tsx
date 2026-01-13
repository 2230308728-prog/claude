'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { bannerService } from '@/services/banner.service';
import type { Banner, UpdateBannerDto } from '@/types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = parseInt(params.id as string);

  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateBannerDto>({});

  useEffect(() => {
    loadBanner();
  }, [bannerId]);

  const loadBanner = async () => {
    try {
      setLoading(true);
      const data = await bannerService.getBanner(bannerId);
      setBanner(data);
      setFormData({
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || '',
        linkType: data.linkType,
        productId: data.productId || undefined,
        categoryId: data.categoryId || undefined,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      });
    } catch (error) {
      console.error('Failed to load banner:', error);
      alert('加载失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      alert('请输入轮播图标题');
      return;
    }

    if (!formData.imageUrl?.trim()) {
      alert('请输入图片URL');
      return;
    }

    try {
      setSaving(true);
      await bannerService.updateBanner(bannerId, formData);
      alert('更新成功！');
      router.push('/dashboard/banners');
    } catch (error) {
      console.error('Failed to update banner:', error);
      alert('更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!banner) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-gray-500">轮播图不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">编辑轮播图</h1>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">开始时间</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate?.split('.')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">结束时间</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate?.split('.')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                  />
                </div>
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
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
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
