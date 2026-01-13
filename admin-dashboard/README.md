# bmad 管理后台

研学商城管理后台 - 基于 Next.js 16 和 React 19 构建的现代化管理系统

## 项目概述

bmad 管理后台是研学商城平台的管理端，提供产品、订单、用户的全面管理功能。

### 主要功能

- **认证系统** - 管理员登录/登出、JWT 令牌管理
- **数据统计** - Dashboard 首页展示关键业务指标
- **产品管理** - 产品列表、新增、编辑、发布/下架、删除
- **订单管理** - 订单列表、状态筛选、订单详情查看
- **用户管理** - 用户列表、角色管理、状态管理

## 技术栈

- **框架**: Next.js 16.1 (App Router)
- **UI**: React 19.2
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **HTTP 客户端**: Axios
- **日期处理**: date-fns
- **图标**: Lucide React

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动（如果端口被占用，会自动使用下一个可用端口）

### 4. 访问应用

打开浏览器访问 `http://localhost:3000`

**默认管理员账号**:
- 邮箱: `admin@bmad.com`
- 密码: 需要先通过后端 API 设置

## 项目结构

```
admin-dashboard/
├── app/                      # Next.js App Router
│   ├── login/               # 登录页面
│   ├── dashboard/           # 管理后台页面
│   │   ├── page.tsx        # 首页/Dashboard
│   │   ├── products/       # 产品管理
│   │   ├── orders/         # 订单管理
│   │   └── users/          # 用户管理
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页重定向
│   └── globals.css         # 全局样式
├── components/              # React 组件
│   ├── ui/                 # 基础 UI 组件
│   ├── sidebar.tsx         # 侧边栏导航
│   ├── dashboard-layout.tsx # Dashboard 布局
│   └── stat-card.tsx       # 统计卡片
├── config/                  # 配置文件
│   └── index.ts            # API 配置
├── services/                # API 服务
│   ├── api.ts              # Axios 实例配置
│   ├── auth.service.ts     # 认证服务
│   ├── product.service.ts  # 产品服务
│   ├── order.service.ts    # 订单服务
│   └── user.service.ts     # 用户服务
├── store/                   # 状态管理
│   └── auth-store.ts       # 认证状态
├── types/                   # TypeScript 类型定义
│   └── index.ts
├── lib/                     # 工具函数
│   └── utils.ts            # cn() 函数
└── hooks/                   # 自定义 Hooks
```

## 开发指南

### 添加新页面

1. 在 `app/dashboard/` 下创建新目录和 `page.tsx`
2. 使用 `DashboardLayout` 包装页面组件
3. 在 `components/sidebar.tsx` 中添加导航链接

### 添加 API 服务

1. 在 `services/` 下创建新的服务文件
2. 使用 `api` 实例发起请求
3. 定义请求/响应类型

### 状态管理

使用 Zustand 进行状态管理：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useXxxStore = create<XxxState>()(
  persist(
    (set) => ({
      // 状态
      // 方法
    }),
    { name: 'xxx-storage' }
  )
);
```

## 可用脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

## API 集成

管理后台通过 RESTful API 与后端通信：

- **认证**: `/api/v1/auth/*`
- **产品**: `/api/v1/products/*`
- **订单**: `/api/v1/orders/*`
- **用户**: `/api/v1/users/*`

详细的 API 文档请查看后端项目的 Swagger 文档：`http://localhost:3000/api/v1/docs`

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 相关文档

- [后端 API 文档](../backend-api/README.md)
- [项目架构文档](../architecture.md)
- [Epic 任务清单](../epics.md)

## License

UNLICENSED
