'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  CreditCard,
  Shield,
  Globe,
  Save,
  Loader2,
} from 'lucide-react';

interface SystemSettings {
  // 通用设置
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;

  // 支付设置
  wechatAppId: string;
  wechatMchId: string;
  wechatApiKey: string;
  wechatApiV3Key: string;
  wechatCertPath: string;
  paymentEnabled: boolean;

  // 通知设置
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  orderNotificationEmail: string;
  lowStockAlertEnabled: boolean;
  lowStockThreshold: number;

  // 安全设置
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'notification' | 'security'>('general');

  const [settings, setSettings] = useState<SystemSettings>({
    // 通用设置
    siteName: 'bmad研学商城',
    siteDescription: '专业的研学旅行产品预订平台',
    siteUrl: 'https://example.com',
    logoUrl: '',
    contactEmail: 'contact@example.com',
    contactPhone: '400-123-4567',

    // 支付设置
    wechatAppId: '',
    wechatMchId: '',
    wechatApiKey: '',
    wechatApiV3Key: '',
    wechatCertPath: '',
    paymentEnabled: true,

    // 通知设置
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    orderNotificationEmail: 'admin@example.com',
    lowStockAlertEnabled: true,
    lowStockThreshold: 10,

    // 安全设置
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireEmailVerification: true,
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      // TODO: 从后端加载设置
      // const response = await api.get('/settings');
      // setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // TODO: 保存设置到后端
      // await api.put('/settings', settings);
      alert('设置保存成功！');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1">管理系统配置和参数</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                通用设置
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payment'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                支付设置
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notification')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notification'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                通知设置
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                安全设置
              </div>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="max-w-4xl">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>通用设置</CardTitle>
                <CardDescription>配置网站基本信息和联系方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">网站名称</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => updateSetting('siteName', e.target.value)}
                      placeholder="请输入网站名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">网站地址</Label>
                    <Input
                      id="siteUrl"
                      value={settings.siteUrl}
                      onChange={(e) => updateSetting('siteUrl', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">网站描述</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => updateSetting('siteDescription', e.target.value)}
                    placeholder="请输入网站描述"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl}
                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">联系邮箱</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => updateSetting('contactEmail', e.target.value)}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">联系电话</Label>
                    <Input
                      id="contactPhone"
                      value={settings.contactPhone}
                      onChange={(e) => updateSetting('contactPhone', e.target.value)}
                      placeholder="400-123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>微信支付设置</CardTitle>
                <CardDescription>配置微信支付相关参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentEnabled">启用支付</Label>
                    <p className="text-sm text-gray-500">启用后用户可以使用微信支付</p>
                  </div>
                  <Switch
                    id="paymentEnabled"
                    checked={settings.paymentEnabled}
                    onCheckedChange={(checked) => updateSetting('paymentEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wechatAppId">小程序 AppID</Label>
                  <Input
                    id="wechatAppId"
                    value={settings.wechatAppId}
                    onChange={(e) => updateSetting('wechatAppId', e.target.value)}
                    placeholder="wxXXXXXXXXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wechatMchId">商户号 MchId</Label>
                  <Input
                    id="wechatMchId"
                    value={settings.wechatMchId}
                    onChange={(e) => updateSetting('wechatMchId', e.target.value)}
                    placeholder="1XXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wechatApiKey">API Key (v2)</Label>
                  <Input
                    id="wechatApiKey"
                    type="password"
                    value={settings.wechatApiKey}
                    onChange={(e) => updateSetting('wechatApiKey', e.target.value)}
                    placeholder="请输入 API Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wechatApiV3Key">API v3 Key</Label>
                  <Input
                    id="wechatApiV3Key"
                    type="password"
                    value={settings.wechatApiV3Key}
                    onChange={(e) => updateSetting('wechatApiV3Key', e.target.value)}
                    placeholder="请输入 API v3 Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wechatCertPath">证书路径</Label>
                  <Input
                    id="wechatCertPath"
                    value={settings.wechatCertPath}
                    onChange={(e) => updateSetting('wechatCertPath', e.target.value)}
                    placeholder="/path/to/cert.pem"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notification' && (
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>配置系统通知和提醒</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotificationsEnabled">邮件通知</Label>
                    <p className="text-sm text-gray-500">启用后系统会发送邮件通知</p>
                  </div>
                  <Switch
                    id="emailNotificationsEnabled"
                    checked={settings.emailNotificationsEnabled}
                    onCheckedChange={(checked) => updateSetting('emailNotificationsEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNotificationEmail">订单通知邮箱</Label>
                  <Input
                    id="orderNotificationEmail"
                    type="email"
                    value={settings.orderNotificationEmail}
                    onChange={(e) => updateSetting('orderNotificationEmail', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotificationsEnabled">短信通知</Label>
                    <p className="text-sm text-gray-500">启用后系统会发送短信通知</p>
                  </div>
                  <Switch
                    id="smsNotificationsEnabled"
                    checked={settings.smsNotificationsEnabled}
                    onCheckedChange={(checked) => updateSetting('smsNotificationsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlertEnabled">低库存预警</Label>
                    <p className="text-sm text-gray-500">当产品库存低于阈值时发送通知</p>
                  </div>
                  <Switch
                    id="lowStockAlertEnabled"
                    checked={settings.lowStockAlertEnabled}
                    onCheckedChange={(checked) => updateSetting('lowStockAlertEnabled', checked)}
                  />
                </div>

                {settings.lowStockAlertEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">低库存阈值</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
                <CardDescription>配置系统安全参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">会话超时时间（分钟）</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)}
                      min={5}
                      max={1440}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value) || 5)}
                      min={1}
                      max={10}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">密码最小长度</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value) || 8)}
                      min={6}
                      max={20}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireEmailVerification">要求邮箱验证</Label>
                    <p className="text-sm text-gray-500">新用户注册时需要验证邮箱</p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={loadSettings}>
              重置
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
