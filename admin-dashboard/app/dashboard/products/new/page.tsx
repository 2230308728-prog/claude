'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productService } from '@/services/product.service';
import type { ProductCategory, CreateProductDto } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductDto>({
    title: '',
    description: '',
    categoryId: 0,
    price: 0,
    originalPrice: undefined,
    stock: 0,
    minAge: undefined,
    maxAge: undefined,
    duration: undefined,
    location: '',
    images: [],
    featured: false,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.categoryId || !formData.price) {
      alert('请填写必填字段');
      return;
    }

    try {
      setLoading(true);
      await productService.createProduct(formData);
      router.push('/dashboard/products');
    } catch (error: any) {
      alert(error.response?.data?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/products')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">新增产品</h1>
            <p className="text-gray-500 mt-1">创建新的研学产品</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>产品信息</CardTitle>
            <CardDescription>填写产品的基本信息和规格</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本信息</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    产品名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入产品名称"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">产品描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入产品描述"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">
                      产品分类 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      id="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                      required
                    >
                      <option value="">请选择分类</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">地点</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="如：北京、上海"
                    />
                  </div>
                </div>
              </div>

              {/* 价格与库存 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">价格与库存</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      售价 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">原价</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={formData.originalPrice || ''}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">
                      库存 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 规格信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">规格信息</h3>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minAge">最小年龄</Label>
                    <Input
                      id="minAge"
                      type="number"
                      value={formData.minAge || ''}
                      onChange={(e) => setFormData({ ...formData, minAge: Number(e.target.value) || undefined })}
                      placeholder="如：6"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAge">最大年龄</Label>
                    <Input
                      id="maxAge"
                      type="number"
                      value={formData.maxAge || ''}
                      onChange={(e) => setFormData({ ...formData, maxAge: Number(e.target.value) || undefined })}
                      placeholder="如：12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">行程天数</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) || undefined })}
                      placeholder="如：7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featured">推荐产品</Label>
                    <Select
                      id="featured"
                      value={formData.featured ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.value === 'true' })}
                    >
                      <option value="false">否</option>
                      <option value="true">是</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 图片上传 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">产品图片</h3>
                <p className="text-sm text-gray-500">图片上传功能开发中...</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/products')}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '提交中...' : '创建产品'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
