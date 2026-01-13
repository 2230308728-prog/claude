'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reviewService } from '@/services/review.service';
import type { Review } from '@/types';
import { ArrowLeft, MessageCircle, Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviewDetail();
  }, [id]);

  const loadReviewDetail = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReview(id);
      setReview(data);
      setReplyText(data.adminReply || '');
    } catch (error: any) {
      alert(error.response?.data?.message || '加载失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      alert('请输入回复内容');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await reviewService.adminReply(id, replyText);
      setReview(updated);
      alert('回复成功');
    } catch (error: any) {
      alert(error.response?.data?.message || '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
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
      loadReviewDetail();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此评价吗？')) return;

    try {
      await reviewService.adminDeleteReview(id);
      router.push('/dashboard/reviews');
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">加载中...</div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">评价不存在</div>
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
            <h1 className="text-3xl font-bold text-gray-900">评价详情</h1>
          </div>
        </div>

        {/* 评价基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>评价信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* 产品信息 */}
                <div className="flex items-center gap-3">
                  {review.product?.images && review.product.images.length > 0 && (
                    <img
                      src={review.product.images[0]}
                      alt={review.product.title}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-lg">{review.product?.title}</div>
                    <div className="text-sm text-gray-500">订单号: {review.order?.orderNo}</div>
                  </div>
                </div>
              </div>
              <div>{getStatusBadge(review.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <div className="text-sm text-gray-500 mb-1">用户</div>
                <div className="flex items-center gap-2">
                  {review.user?.avatarUrl && (
                    <img
                      src={review.user.avatarUrl}
                      alt={review.user.nickname}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span>{review.isAnonymous ? '匿名用户' : review.user?.nickname || '未知用户'}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">评分</div>
                <div>{renderStars(review.rating)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">创建时间</div>
                <div>{new Date(review.createdAt).toLocaleString('zh-CN')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">是否匿名</div>
                <div>{review.isAnonymous ? '是' : '否'}</div>
              </div>
            </div>

            {/* 评价内容 */}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500 mb-2">评价内容</div>
              <p className="text-gray-900">{review.content || '无文字评价'}</p>
            </div>

            {/* 评价图片 */}
            {review.images && review.images.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-500 mb-2">评价图片</div>
                <div className="flex gap-2 flex-wrap">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`评价图片 ${index + 1}`}
                      className="h-32 w-32 rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            {review.status === 'PENDING' && (
              <div className="pt-4 border-t flex gap-2">
                <Button onClick={() => handleApprove(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  通过审核
                </Button>
                <Button variant="outline" onClick={() => handleApprove(false)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  拒绝审核
                </Button>
                <Button variant="outline" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 管理员回复 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              管理员回复
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {review.adminReply && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">
                  回复时间: {review.repliedAt ? new Date(review.repliedAt).toLocaleString('zh-CN') : '-'}
                </div>
                <p className="text-gray-900">{review.adminReply}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {review.adminReply ? '修改回复' : '添加回复'}
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="请输入回复内容..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleReply} disabled={submitting}>
                {submitting ? '提交中...' : '提交回复'}
              </Button>
              {review.adminReply && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('确定要删除回复吗？')) {
                      setReplyText('');
                      handleReply();
                    }
                  }}
                  disabled={submitting}
                >
                  删除回复
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
