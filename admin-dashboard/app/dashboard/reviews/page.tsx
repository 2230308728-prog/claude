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
import { reviewService } from '@/services/review.service';
import type { Review, ReviewQuery, ReviewStatus } from '@/types';
import { Search, MessageCircle, Star, CheckCircle, XCircle } from 'lucide-react';

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<ReviewQuery>({
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0);

  useEffect(() => {
    loadReviews();
  }, [query, statusFilter, ratingFilter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviews({
        ...query,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter || undefined,
      });
      setReviews(data.data);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery({ ...query, page: 1 });
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待审核</Badge>;
      case 'APPROVED':
        return <Badge variant="default">已通过</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleApprove = async (id: number, approved: boolean) => {
    try {
      if (approved) {
        await reviewService.approveReview(id, 'APPROVED');
      } else {
        const reason = prompt('请输入拒绝原因：');
        if (reason) {
          await reviewService.approveReview(id, 'REJECTED', reason);
        } else {
          return;
        }
      }
      loadReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此评价吗？')) return;

    try {
      await reviewService.adminDeleteReview(id);
      loadReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">评价管理</h1>
            <p className="text-gray-500 mt-1">审核和管理用户评价</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>评价列表</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | '')}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="PENDING">待审核</option>
                  <option value="APPROVED">已通过</option>
                  <option value="REJECTED">已拒绝</option>
                </select>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(parseInt(e.target.value) || 0)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="0">全部评分</option>
                  <option value="5">5星</option>
                  <option value="4">4星</option>
                  <option value="3">3星</option>
                  <option value="2">2星</option>
                  <option value="1">1星</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索评价内容..."
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
                      <TableHead>产品</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>评分</TableHead>
                      <TableHead>评价内容</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {review.product?.images && review.product.images.length > 0 && (
                              <img
                                src={review.product.images[0]}
                                alt={review.product.title}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{review.product?.title}</div>
                              <div className="text-sm text-gray-500">
                                订单号: {review.order?.orderNo}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {review.user?.avatarUrl && (
                              <img
                                src={review.user.avatarUrl}
                                alt={review.user.nickname}
                                className="h-8 w-8 rounded-full"
                              />
                            )}
                            <span>{review.isAnonymous ? '匿名用户' : review.user?.nickname}</span>
                          </div>
                        </TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm line-clamp-2">{review.content || '无文字评价'}</p>
                            {review.images && review.images.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {review.images.length} 张图片
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(review.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {review.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/dashboard/reviews/${review.id}`)}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  详情
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(review.id, true)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  通过
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(review.id, false)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  拒绝
                                </Button>
                              </>
                            )}
                            {review.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/reviews/${review.id}`)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                回复
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(review.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {reviews.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          暂无评价
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
                        disabled={reviews.length < (query.pageSize || 20)}
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
