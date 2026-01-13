'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { User, Lock, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-500 mt-1">管理您的账户和偏好设置</p>
        </div>

        <div className="grid gap-6 max-w-3xl">
          {/* 个人信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人信息
              </CardTitle>
              <CardDescription>更新您的个人信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称</Label>
                <Input id="nickname" value={user?.nickname || ''} placeholder="请输入昵称" />
              </div>
              <div className="flex justify-end">
                <Button>保存更改</Button>
              </div>
            </CardContent>
          </Card>

          {/* 修改密码 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                修改密码
              </CardTitle>
              <CardDescription>更改您的账户密码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input id="current-password" type="password" placeholder="请输入当前密码" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input id="new-password" type="password" placeholder="请输入新密码" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认密码</Label>
                <Input id="confirm-password" type="password" placeholder="请再次输入新密码" />
              </div>
              <div className="flex justify-end">
                <Button>更新密码</Button>
              </div>
            </CardContent>
          </Card>

          {/* 通知设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知设置
              </CardTitle>
              <CardDescription>选择您希望接收的通知</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">新订单通知</p>
                  <p className="text-sm text-gray-500">当有新订单时接收通知</p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">退款申请通知</p>
                  <p className="text-sm text-gray-500">当有退款申请时接收通知</p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">库存预警通知</p>
                  <p className="text-sm text-gray-500">当产品库存不足时接收通知</p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
