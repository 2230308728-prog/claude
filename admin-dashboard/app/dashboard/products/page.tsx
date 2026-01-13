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
import { productService } from '@/services/product.service';
import type { Product, ProductCategory, ProductQuery } from '@/types';
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<ProductQuery>({
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, [query]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(query),
        productService.getCategories(),
      ]);
      setProducts(productsData.data);
      setCategories(categoriesData);
      setTotal(productsData.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, keyword: searchKeyword, page: 1 });
  };

  const handlePublish = async (id: number) => {
    try {
      await productService.publishProduct(id);
      loadData();
    } catch (error) {
      console.error('Failed to publish product:', error);
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await productService.unpublishProduct(id);
      loadData();
    } catch (error) {
      console.error('Failed to unpublish product:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此产品吗？')) return;
    try {
      await productService.deleteProduct(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '-';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'success',
      UNPUBLISHED: 'warning',
    };
    const labels: Record<string, string> = {
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      UNPUBLISHED: '已下架',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">产品管理</h1>
            <p className="text-gray-500 mt-1">管理您的研学产品</p>
          </div>
          <Button onClick={() => router.push('/dashboard/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新增产品
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>产品列表</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索产品..."
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
                      <TableHead>产品名称</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>价格</TableHead>
                      <TableHead>库存</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>浏览</TableHead>
                      <TableHead>预订</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                        <TableCell>¥{product.price}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>{product.viewCount}</TableCell>
                        <TableCell>{product.bookingCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {product.status === 'PUBLISHED' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnpublish(product.id)}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePublish(product.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          暂无产品数据
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
                        disabled={products.length < (query.pageSize || 20)}
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
