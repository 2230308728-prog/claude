# bmad Backend API

研学商城小程序后端 API 服务 - 基于 NestJS 11 构建的现代化电商后端系统

## 项目概述

bmad (研学商城) 是一个研学旅行产品预订平台的后端 API 服务，为小程序端和管理后台提供完整的业务支撑。

### 主要功能

- 用户认证与授权 (JWT + Redis 黑名单)
- 产品与分类管理
- 订单与支付系统 (微信支付)
- 售后服务 (工单系统)
- 数据统计与分析
- 文件上传 (阿里云 OSS)
- 定时任务与缓存
- API 限流与安全防护

## 技术栈

- **框架**: NestJS 11.0
- **语言**: TypeScript 5.7
- **数据库**: PostgreSQL 16
- **ORM**: Prisma 7.2
- **缓存**: Redis 7 (ioreids)
- **认证**: JWT (Passport.js)
- **文档**: Swagger/OpenAPI 3.0
- **对象存储**: 阿里云 OSS
- **支付**: 微信支付 v3
- **测试**: Jest, Supertest

## 系统要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9.0.0

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置以下变量:

```bash
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/bmad?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=7d

# 微信小程序
WECHAT_APP_ID=your-wechat-appid
WECHAT_APP_SECRET=your-wechat-secret

# 微信支付
WECHAT_PAY_MCHID=your-mchid
WECHAT_PAY_SERIAL_NO=your-serial-no
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/private_key.pem
WECHAT_PAY_APIV3_KEY=your-apiv3-key

# 阿里云 OSS (可选)
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=bmad-storage
```

### 3. 数据库设置

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充种子数据
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run start:dev
```

服务将在 `http://localhost:3000` 启动

## API 文档

启动服务后访问 Swagger 文档:

```
http://localhost:3000/api/v1/docs
```

### 主要 API 端点

#### 认证模块 (`/auth`)
- `POST /auth/admin/register` - 管理员注册
- `POST /auth/admin/login` - 管理员登录
- `POST /auth/wechat/login` - 微信登录
- `POST /auth/refresh` - 刷新令牌
- `POST /auth/logout` - 登出

#### 产品模块 (`/products`)
- `GET /products` - 获取产品列表
- `GET /products/:id` - 获取产品详情
- `POST /products` - 创建产品 (管理员)
- `PUT /products/:id` - 更新产品 (管理员)
- `DELETE /products/:id` - 删除产品 (管理员)
- `POST /products/:id/publish` - 发布产品 (管理员)
- `POST /products/:id/unpublish` - 下架产品 (管理员)

#### 订单模块 (`/orders`)
- `POST /orders` - 创建订单
- `GET /orders` - 获取订单列表
- `GET /orders/:id` - 获取订单详情
- `POST /orders/:id/pay` - 支付订单
- `POST /orders/:id/cancel` - 取消订单

#### 用户模块 (`/users`)
- `GET /users` - 获取用户列表 (管理员)
- `GET /users/dashboard/stats` - 获取统计数据 (管理员)

## 数据库架构

核心数据模型:

- **User** - 用户表 (管理员/家长)
- **Product** - 产品表
- **ProductCategory** - 产品分类
- **Order** - 订单表
- **OrderItem** - 订单明细
- **Payment** - 支付记录
- **Refund** - 退款记录
- **Issue** - 售后工单
- **Coupon** - 优惠券
- **Cart** - 购物车

详细设计见 [database-design.md](../database-design.md)

## 运行测试

```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov

# 快速 API 测试 (需要服务先启动)
./scripts/test-api.sh
```

## 项目结构

```
backend-api/
├── src/
│   ├── common/              # 公共模块
│   │   ├── decorators/      # 装饰器
│   │   ├── filters/         # 异常过滤器
│   │   ├── guards/          # 守卫
│   │   ├── interceptors/    # 拦截器
│   │   ├── middlewares/     # 中间件
│   │   ├── oss/            # OSS 服务
│   │   ├── pipes/          # 管道
│   │   └── prisma/         # Prisma 服务
│   ├── modules/            # 业务模块
│   │   ├── auth/          # 认证模块
│   │   ├── users/         # 用户模块
│   │   ├── products/      # 产品模块
│   │   ├── orders/        # 订单模块
│   │   ├── payments/      # 支付模块
│   │   └── issues/        # 售后模块
│   ├── config/            # 配置文件
│   └── main.ts           # 应用入口
├── prisma/
│   ├── schema.prisma     # Prisma Schema
│   └── seed.ts          # 种子数据
├── scripts/              # 工具脚本
├── test/                # 测试文件
└── certs/              # 微信支付证书

```

## 开发指南

### 添加新模块

```bash
# 使用 Nest CLI 生成模块
nest g module modules/feature
nest g controller modules/feature
nest g service modules/feature
```

### 数据库变更

```bash
# 修改 prisma/schema.prisma 后

# 创建迁移
npx prisma migrate dev --name describe_changes

# 部署到生产
npx prisma migrate deploy
```

### 环境变量

所有环境变量定义在 `src/config/configuration.ts`，使用 `@nestjs/config` 管理。

## 部署

### 构建

```bash
npm run build
```

### 生产环境运行

```bash
npm run start:prod
```

### 使用 PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## 常见问题

### 数据库连接失败

检查 `DATABASE_URL` 是否正确，PostgreSQL 服务是否启动:

```bash
brew services start postgresql@16
```

### Redis 连接失败

检查 Redis 服务是否启动:

```bash
brew services start redis
```

### Prisma Client 未生成

```bash
npm run prisma:generate
```

## 相关文档

- [API 文档](../api-documentation.md)
- [数据库设计](../database-design.md)
- [架构设计](../architecture.md)
- [PRD](../prd.md)
- [Epic 任务清单](../epics.md)
- [UX 设计规范](../ux-design-specification.md)

## License

UNLICENSED
