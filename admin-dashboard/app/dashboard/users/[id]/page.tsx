'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userService } from '@/services/user.service';
import type { User } from '@/types';
import { ArrowLeft, Mail, Calendar, Shield } from 'lucide-react';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return <Badge variant="default">管理员</Badge>;
    }
    return <Badge variant="secondary">家长</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      BANNED: 'destructive',
    };
    const labels: Record<string, string> = {
      ACTIVE: '正常',
      INACTIVE: '未激活',
      BANNED: '已封禁',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-lg">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-lg text-gray-500">用户不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">用户详情</h1>
            <p className="text-gray-500 mt-1">用户 ID: {user.id}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">头像</p>
                <div className="mt-2">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname || '头像'}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                      {user.nickname?.[0] || user.email[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">昵称</p>
                <p className="font-medium">{user.nickname || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    角色
                  </p>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <div className="mt-1">{getStatusBadge(user.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                时间信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">注册时间</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">更新时间</p>
                <p className="font-medium">{formatDate(user.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 账户操作 */}
        <Card>
          <CardHeader>
            <CardTitle>账户操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {user.status === 'ACTIVE' && (
                <Button variant="destructive" size="sm">
                  封禁用户
                </Button>
              )}
              {user.status === 'BANNED' && (
                <Button variant="default" size="sm">
                  解封用户
                </Button>
              )}
              {user.status === 'INACTIVE' && (
                <Button variant="default" size="sm">
                  激活用户
                </Button>
              )}
              <Button variant="outline" size="sm">
                重置密码
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 订单历史 */}
        <Card>
          <CardHeader>
            <CardTitle>订单历史</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              订单历史功能开发中...
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
