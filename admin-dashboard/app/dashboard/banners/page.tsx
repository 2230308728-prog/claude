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
import { bannerService } from '@/services/banner.service';
import type { Banner, BannerQuery } from '@/types';
import { Plus, Search, Edit, Trash2, Power, Image } from 'lucide-react';

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<BannerQuery>({
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadBanners();
  }, [query, statusFilter]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerService.getBanners({
        ...query,
        keyword: searchKeyword || undefined,
        isEnabled: statusFilter,
      });
      setBanners(data.data);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, page: 1 });
  };

  const handleToggleEnabled = async (id: number) => {
    try {
      await bannerService.toggleEnabled(id);
      loadBanners();
    } catch (error) {
      console.error('Failed to toggle banner:', error);
      alert('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个轮播图吗？')) {
      return;
    }

    try {
      await bannerService.deleteBanner(id);
      loadBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('删除失败');
    }
  };

  const getLinkTypeBadge = (linkType: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      none: { label: '无链接', className: 'bg-gray-100 text-gray-800' },
      product: { label: '产品', className: 'bg-blue-100 text-blue-800' },
      category: { label: '分类', className: 'bg-green-100 text-green-800' },
      url: { label: '外部链接', className: 'bg-purple-100 text-purple-800' },
      mini_program: { label: '小程序', className: 'bg-orange-100 text-orange-800' },
    };
    return badges[linkType] || badges.none;
  };

  const isValidDate = (banner: Banner) => {
    if (!banner.startDate && !banner.endDate) return true;
    const now = new Date();
    if (banner.startDate && new Date(banner.startDate) > now) return false;
    if (banner.endDate && new Date(banner.endDate) < now) return false;
    return true;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">轮播图管理</h1>
            <p className="text-gray-500 mt-1">管理首页轮播图</p>
          </div>
          <Button onClick={() => router.push('/dashboard/banners/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新建轮播图
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="搜索标题..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
                />
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  搜索
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === undefined ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(undefined)}
                >
                  全部
                </Button>
                <Button
                  variant={statusFilter === true ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(true)}
                >
                  已启用
                </Button>
                <Button
                  variant={statusFilter === false ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(false)}
                >
                  已禁用
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 轮播图列表 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">图片</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>链接类型</TableHead>
                  <TableHead>关联内容</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : banners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无轮播图
                    </TableCell>
                  </TableRow>
                ) : (
                  banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="w-20 h-14 rounded overflow-hidden bg-gray-100">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      <TableCell>
                        <Badge className={getLinkTypeBadge(banner.linkType).className}>
                          {getLinkTypeBadge(banner.linkType).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {banner.linkType === 'product' && banner.product && (
                          <span>{banner.product.title}</span>
                        )}
                        {banner.linkType === 'category' && banner.category && (
                          <span>{banner.category.name}</span>
                        )}
                        {banner.linkType === 'url' && banner.linkUrl && (
                          <span className="max-w-[200px] truncate block">{banner.linkUrl}</span>
                        )}
                        {banner.linkType === 'none' && <span>-</span>}
                      </TableCell>
                      <TableCell>{banner.sortOrder}</TableCell>
                      <TableCell>
                        <Badge
                          variant={banner.isEnabled ? 'default' : 'secondary'}
                          className={
                            banner.isEnabled
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {banner.isEnabled ? '已启用' : '已禁用'}
                        </Badge>
                        {!isValidDate(banner) && (
                          <Badge className="ml-2 bg-orange-100 text-orange-800">
                            已过期
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {banner.startDate && (
                          <div>开始: {new Date(banner.startDate).toLocaleDateString('zh-CN')}</div>
                        )}
                        {banner.endDate && (
                          <div>结束: {new Date(banner.endDate).toLocaleDateString('zh-CN')}</div>
                        )}
                        {!banner.startDate && !banner.endDate && <span>不限</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/banners/${banner.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleEnabled(banner.id)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(banner.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 分页信息 */}
        <div className="mt-4 text-sm text-gray-600">
          共 {total} 条记录
        </div>
      </div>
    </DashboardLayout>
  );
}
