'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'order' | 'refund' | 'review' | 'stock' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 模拟通知数据（实际应从后端获取）
  useEffect(() => {
    // 模拟初始通知
    setNotifications([
      {
        id: '1',
        type: 'order',
        title: '新订单',
        message: '用户张三刚刚下了一个新订单',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/dashboard/orders'
      },
      {
        id: '2',
        type: 'refund',
        title: '退款申请',
        message: '订单 #12345 申请退款',
        read: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        link: '/dashboard/refunds'
      },
      {
        id: '3',
        type: 'stock',
        title: '库存预警',
        message: '产品"户外探索营"库存不足10件',
        read: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        link: '/dashboard/products'
      }
    ]);
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      order: '📦',
      refund: '💰',
      review: '⭐',
      stock: '⚠️',
      system: '🔔'
    };
    return icons[type] || icons.system;
  };

  const getNotificationColor = (type: Notification['type']) => {
    const colors = {
      order: 'bg-blue-100 text-blue-600',
      refund: 'bg-orange-100 text-orange-600',
      review: 'bg-yellow-100 text-yellow-600',
      stock: 'bg-red-100 text-red-600',
      system: 'bg-gray-100 text-gray-600'
    };
    return colors[type] || colors.system;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div className="flex-1"></div>

      {/* Notification Bell */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Notification Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">通知</h3>
                <p className="text-sm text-gray-500">{notifications.length} 条通知</p>
              </div>
              <div className="flex gap-2">
                {notifications.some(n => !n.read) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    全部已读
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    清空
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="h-12 w-12 mb-2 opacity-20" />
                  <p>暂无通知</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors relative group",
                        !notification.read && "bg-blue-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </header>
  );
}
