# bmad 研学商城平台 - 项目总结

## 项目概述

bmad（研学商城）是一个完整的研学旅行产品预订平台，包含后端 API、管理后台和小程序端。

## 项目架构

```
bmad/
├── backend-api/          # 后端 API (NestJS 11 + Prisma)
├── admin-dashboard/      # 管理后台 (Next.js 16 + React 19)
├── miniprogram/         # 小程序端 (待开发)
└── docs/                # 项目文档
```

## 技术栈

### 后端 API
- **框架**: NestJS 11.0 (TypeScript Strict Mode)
- **数据库**: PostgreSQL 16 + Prisma 7.2
- **缓存**: Redis 7
- **认证**: JWT + Passport.js
- **文档**: Swagger/OpenAPI 3.0
- **支付**: 微信支付 v3
- **存储**: 阿里云 OSS

### 管理后台
- **框架**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **状态**: Zustand
- **表单**: React Hook Form + Zod
- **HTTP**: Axios
- **图标**: Lucide React

## 核心功能

### 1. 认证系统 ✅
- 管理员账号密码登录
- 微信授权登录（家长端）
- JWT 令牌管理（访问 + 刷新）
- Redis 黑名单（登出）
- 自动令牌刷新

### 2. 产品管理 ✅
- 产品 CRUD 操作
- 产品分类管理
- 发布/下架控制
- 库存管理
- 产品搜索
- 推荐产品

### 3. 订单管理 ✅
- 订单创建
- 订单支付（微信支付）
- 订单状态管理
- 订单取消
- 订单统计

### 4. 用户管理 ✅
- 用户列表
- 用户详情
- 角色管理（管理员/家长）
- 状态管理

### 5. 数据统计 ✅
- Dashboard 统计
- 订单趋势
- 用户统计
- 产品统计

## API 端点总览

### 认证模块 (`/api/v1/auth`)
```
POST   /auth/admin/register   # 管理员注册
POST   /auth/admin/login      # 管理员登录
POST   /auth/wechat/login     # 微信登录
POST   /auth/refresh          # 刷新令牌
POST   /auth/logout           # 登出
```

### 产品模块 (`/api/v1/products`)
```
GET    /products              # 产品列表
GET    /products/:id          # 产品详情
POST   /products              # 创建产品
PUT    /products/:id          # 更新产品
DELETE /products/:id          # 删除产品
POST   /products/:id/publish  # 发布产品
POST   /products/:id/unpublish # 下架产品
```

### 产品分类 (`/api/v1/products/categories`)
```
GET    /products/categories     # 分类列表
POST   /products/categories     # 创建分类
PUT    /products/categories/:id # 更新分类
DELETE /products/categories/:id # 删除分类
```

### 订单模块 (`/api/v1/orders`)
```
GET    /orders                # 订单列表
POST   /orders                # 创建订单
GET    /orders/:id            # 订单详情
POST   /orders/:id/cancel     # 取消订单
```

### 用户模块 (`/api/v1/users`)
```
GET    /users                 # 用户列表
GET    /users/:id             # 用户详情
PUT    /users/:id/status      # 更新状态
```

### 统计模块 (`/api/v1/users/dashboard`)
```
GET    /dashboard/stats        # 统计数据
GET    /dashboard/order-stats  # 订单统计
```

**总计**: 32+ API 端点

## 管理后台页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 登录 | `/login` | 管理员登录 |
| 首页 | `/dashboard` | 数据统计 |
| 产品列表 | `/dashboard/products` | 产品管理 |
| 产品分类 | `/dashboard/products/categories` | 分类管理 |
| 新增产品 | `/dashboard/products/new` | 创建产品 |
| 编辑产品 | `/dashboard/products/[id]/edit` | 编辑产品 |
| 订单列表 | `/dashboard/orders` | 订单管理 |
| 订单详情 | `/dashboard/orders/[id]` | 订单详情 |
| 用户列表 | `/dashboard/users` | 用户管理 |
| 用户详情 | `/dashboard/users/[id]` | 用户详情 |
| 设置 | `/dashboard/settings` | 账户设置 |

## 数据库模型

### 核心表
- `User` - 用户表
- `Product` - 产品表
- `ProductCategory` - 产品分类表
- `Order` - 订单表
- `OrderItem` - 订单明细表
- `Payment` - 支付记录表
- `Refund` - 退款记录表
- `Issue` - 售后工单表
- `Coupon` - 优惠券表
- `Cart` - 购物车表

## 开发状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 后端 API | ✅ 完成 | 所有核心功能已实现 |
| 管理后台 | ✅ 完成 | 所有页面已完成 |
| 小程序端 | ⏳ 待开发 | 下一步计划 |

## 本地运行

### 启动后端 API
```bash
cd backend-api
npm install
npm run start:dev
# 运行在 http://localhost:3000
```

### 启动管理后台
```bash
cd admin-dashboard
npm install
npm run dev
# 运行在 http://localhost:3002
```

### 默认账号
- 邮箱: `admin@bmad.com`
- 密码: 需要通过 API 设置

## 测试

### API 测试脚本
```bash
cd backend-api
./scripts/test-api.sh
```

### E2E 测试
```bash
cd backend-api
npm run test:e2e
```

## 部署

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 项目文档

- [README.md](./backend-api/README.md) - 后端 API 文档
- [DEVELOPMENT.md](./backend-api/DEVELOPMENT.md) - 开发指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
- [api-documentation.md](./api-documentation.md) - API 详细文档
- [architecture.md](./architecture.md) - 架构设计
- [database-design.md](./database-design.md) - 数据库设计
- [prd.md](./prd.md) - 产品需求文档
- [epics.md](./epics.md) - Epic 任务清单

## 下一步计划

### 短期
- [ ] 优化错误处理
- [ ] 添加单元测试
- [ ] 完善图片上传功能
- [ ] 优化数据可视化

### 中期
- [ ] 开发小程序端
- [ ] 实现退款流程
- [ ] 添加优惠券功能
- [ ] 实现购物车功能

### 长期
- [ ] 性能优化
- [ ] 监控告警
- [ ] CI/CD 流水线
- [ ] 多语言支持

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## License

UNLICENSED

## 联系方式

如有问题或建议，请联系项目维护者。

---

**最后更新**: 2026-01-13
**版本**: 1.0.0
