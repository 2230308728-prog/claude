# bmad 研学商城平台

一个完整的研学旅行产品预订平台，包含后端 API、管理后台和小程序端。

## 项目简介

bmad（研学商城）是一个面向家长的研学旅行产品预订平台，家长可以浏览、搜索、预订各种研学产品，管理员可以通过后台管理产品、订单和用户。

## 系统架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  小程序端   │ ───▶ │  后端 API   │ ◀─── │ 管理后台   │
│ (用户端)    │      │ (NestJS)    │      │ (Next.js)   │
│             │      │             │      │             │
│ - 产品浏览  │      │ - RESTful   │      │ - 产品管理  │
│ - 下单支付  │      │ - JWT 认证  │      │ - 订单管理  │
│ - 订单管理  │      │ - 微信支付  │      │ - 用户管理  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                      ┌─────────────┐
                      │ PostgreSQL  │
                      │ + Redis     │
                      └─────────────┘
```

## 技术栈

### 后端 API
- **框架**: NestJS 11 + TypeScript
- **数据库**: PostgreSQL 16 + Prisma 7.2
- **缓存**: Redis 7
- **认证**: JWT + Passport.js
- **文档**: Swagger/OpenAPI
- **支付**: 微信支付 v3

### 管理后台
- **框架**: Next.js 16 + React 19
- **样式**: Tailwind CSS 4
- **状态**: Zustand
- **UI**: shadcn/ui 风格

### 小程序端
- **平台**: 微信小程序
- **框架**: 原生小程序
- **语言**: JavaScript ES6+
- **样式**: WXSS

## 功能特性

### 用户端功能
- ✅ 微信授权登录
- ✅ 产品浏览与搜索
- ✅ 产品详情查看
- ✅ 产品收藏
- ✅ 在线下单
- ✅ 订单确认
- ✅ 微信支付
- ✅ 订单管理
- ✅ 个人中心
- ✅ 客服联系

### 管理端功能
- ✅ 产品管理（增删改查）
- ✅ 产品分类管理
- ✅ 订单管理与状态更新
- ✅ 用户管理
- ✅ 数据统计与分析
- ✅ 退款审核

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9.0.0

### 安装与运行

#### 1. 后端 API

```bash
cd backend-api
npm install
npm run start:dev
# 运行在 http://localhost:3000
```

#### 2. 管理后台

```bash
cd admin-dashboard
npm install
npm run dev
# 运行在 http://localhost:3002
```

#### 3. 小程序端

使用微信开发者工具打开 `miniprogram` 目录：

```bash
# 1. 下载并安装微信开发者工具
# https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

# 2. 修改项目配置
# 编辑 miniprogram/project.config.json，填入你的小程序 AppID

# 3. 修改 API 地址
# 编辑 miniprogram/app.js，修改 apiBaseUrl 为实际后端地址

# 4. 使用微信开发者工具打开 miniprogram 目录

# 5. 点击"编译"按钮运行
```

**注意**:
- 开发时可在微信开发者工具中勾选"不校验合法域名"
- 图片资源需自行添加到 `miniprogram/images/` 目录
- 详见 [miniprogram/README.md](./miniprogram/README.md)

## 项目结构

```
bmad/
├── backend-api/          # 后端 API
│   ├── src/
│   │   ├── modules/      # 业务模块
│   │   ├── common/       # 公共模块
│   │   └── config/       # 配置文件
│   ├── prisma/           # 数据库 Schema
│   └── test/             # 测试文件
├── admin-dashboard/      # 管理后台
│   ├── app/              # Next.js 页面
│   ├── components/      # React 组件
│   ├── services/         # API 服务
│   └── store/           # 状态管理
├── miniprogram/         # 小程序端
│   ├── pages/           # 小程序页面（8个页面）
│   │   ├── index/       # 首页
│   │   ├── products/    # 产品列表
│   │   ├── product/     # 产品详情
│   │   ├── order-confirm/ # 订单确认
│   │   ├── orders/      # 订单列表
│   │   ├── order/       # 订单详情
│   │   ├── profile/     # 个人中心
│   │   └── login/       # 登录页
│   ├── components/      # 小程序组件
│   ├── utils/           # 工具函数
│   ├── images/          # 图片资源
│   └── app.js/json/wxss # 应用配置
├── docs/                # 项目文档
│   ├── prd.md
│   ├── architecture.md
│   ├── database-design.md
│   └── api-documentation.md
├── DEPLOYMENT.md         # 部署指南
└── PROJECT_SUMMARY.md    # 项目总结
```

## API 文档

- Swagger 文档: http://localhost:3000/api/v1/docs
- 详细文档: [backend-api/README.md](./backend-api/README.md)

## 数据库模型

核心数据模型：
- User（用户）
- Product（产品）
- ProductCategory（产品分类）
- Order（订单）
- Payment（支付）
- Refund（退款）
- Issue（售后工单）

## 开发指南

- [后端开发指南](./backend-api/DEVELOPMENT.md)
- [部署指南](./DEPLOYMENT.md)

## 测试

```bash
# API 测试
cd backend-api
./scripts/test-api.sh

# E2E 测试
npm run test:e2e
```

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

UNLICENSED

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**最后更新**: 2026-01-13
**版本**: 1.0.0
