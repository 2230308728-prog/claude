'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { productService } from '@/services/product.service';
import type { ProductCategory } from '@/types';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await productService.createCategory(formData);
      await loadCategories();
      resetForm();
      showToast('分类创建成功', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || '创建失败', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    try {
      await productService.updateCategory(editingCategory.id, formData);
      await loadCategories();
      resetForm();
      showToast('分类更新成功', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || '更新失败', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此分类吗？')) return;
    try {
      await productService.deleteCategory(id);
      await loadCategories();
      showToast('分类删除成功', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || '删除失败', 'error');
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', sortOrder: 0 });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // 使用浏览器原生的 alert 作为临时方案
    // 在实际项目中可以集成 toast 通知
    alert(message);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">产品分类管理</h1>
            <p className="text-gray-500 mt-1">管理产品的分类信息</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增分类
          </Button>
        </div>

        {/* 表单 */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingCategory ? '编辑分类' : '新增分类'}
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      分类名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入分类名称"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">排序</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">分类描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入分类描述"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                  <Button type="submit">
                    {editingCategory ? '更新' : '创建'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 分类列表 */}
        <Card>
          <CardHeader>
            <CardTitle>分类列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排序</TableHead>
                    <TableHead>分类名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>产品数</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.sortOrder}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-gray-500 max-w-xs truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        暂无分类数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
