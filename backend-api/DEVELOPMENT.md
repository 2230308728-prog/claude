# 开发指南

本文档提供 bmad 后端 API 的开发指南，包括开发环境设置、编码规范、测试和部署流程。

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [编码规范](#编码规范)
- [Git 工作流](#git-工作流)
- [测试指南](#测试指南)
- [调试技巧](#调试技巧)

## 开发环境设置

### 前置要求

1. **Node.js 18+**
   ```bash
   node --version  # 应该 >= 18.0.0
   ```

2. **PostgreSQL 14+**
   ```bash
   # macOS (Homebrew)
   brew install postgresql@16
   brew services start postgresql@16

   # 创建数据库
   createdb bmad
   ```

3. **Redis 6+**
   ```bash
   # macOS (Homebrew)
   brew install redis
   brew services start redis
   ```

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd backend-api
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入实际配置
   ```

4. **设置数据库**
   ```bash
   # 生成 Prisma Client
   npm run prisma:generate

   # 运行迁移
   npm run prisma:migrate

   # 填充种子数据
   npm run prisma:seed
   ```

5. **启动开发服务器**
   ```bash
   npm run start:dev
   ```

## 项目结构

```
src/
├── common/                 # 公共模块
│   ├── decorators/        # 自定义装饰器
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/           # 异常过滤器
│   │   └── http-exception.filter.ts
│   ├── guards/            # 守卫
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/      # 拦截器
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── middlewares/       # 中间件
│   ├── pipes/            # 管道
│   ├── oss/             # OSS 文件上传服务
│   └── prisma/          # Prisma 数据库服务
│       └── prisma.service.ts
├── config/               # 配置文件
│   └── configuration.ts
├── modules/              # 业务模块
│   ├── auth/            # 认证模块
│   │   ├── dto/        # 数据传输对象
│   │   ├── guards/     # 认证守卫
│   │   ├── strategies/ # Passport 策略
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/          # 用户模块
│   ├── products/       # 产品模块
│   ├── orders/         # 订单模块
│   ├── payments/       # 支付模块
│   └── issues/         # 售后模块
└── main.ts             # 应用入口
```

### 模块组织

每个业务模块应遵循以下结构:

```
module-name/
├── dto/              # 请求数据和响应数据
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── entities/         # 实体定义 (如果需要)
├── *.module.ts       # 模块定义
├── *.controller.ts   # 控制器
├── *.service.ts      # 服务层
└── *.spec.ts         # 单元测试
```

## 编码规范

### TypeScript 规范

1. **使用严格类型检查**
   ```typescript
   // 好的实践
   async getUser(id: number): Promise<User | null> {
     return this.prisma.user.findUnique({ where: { id } });
   }

   // 避免
   async getUser(id: any): Promise<any> {
     return this.prisma.user.findUnique({ where: { id } });
   }
   ```

2. **使用类型别名和接口**
   ```typescript
   // 定义清晰的类型
   export type AuthUser = {
     id: number;
     email: string;
     role: Role;
   };

   // 使用接口定义 DTO
   export interface CreateUserDto {
     email: string;
     password: string;
     nickname?: string;
   }
   ```

3. **DTO 验证**
   ```typescript
   import { IsString, IsEmail, MinLength } from 'class-validator';

   export class CreateUserDto {
     @IsEmail()
     email: string;

     @IsString()
     @MinLength(8)
     password: string;
   }
   ```

### 命名约定

- **文件名**: 使用 kebab-case (例: `user.service.ts`)
- **类名**: 使用 PascalCase (例: `UserService`)
- **方法和变量**: 使用 camelCase (例: `getUserById`)
- **常量**: 使用 UPPER_SNAKE_CASE (例: `MAX_RETRY_COUNT`)
- **接口**: 使用 PascalCase，无前缀 (例: `UserResponse`)
- **类型别名**: 使用 PascalCase (例: `AuthUser`)

### 代码组织

1. **导入顺序**
   ```typescript
   // 1. Node.js 内置模块
   import { Module } from '@nestjs/common';

   // 2. 第三方库
   import { Injectable } from '@nestjs/common';
   import { Prisma } from '@prisma/client';

   // 3. 项目内部模块
   import { PrismaService } from '../common/prisma/prisma.service';

   // 4. 相对导入
   import { CreateUserDto } from './dto';
   ```

2. **Service 层最佳实践**
   ```typescript
   @Injectable()
   export class UserService {
     constructor(private prisma: PrismaService) {}

     // 事务处理示例
     async createUserWithProfile(data: CreateUserDto) {
       return this.prisma.$transaction(async (tx) => {
         const user = await tx.user.create({ data: data.userData });
         await tx.profile.create({ data: { ...data.profileData, userId: user.id } });
         return user;
       });
     }
   }
   ```

3. **Controller 层最佳实践**
   ```typescript
   @Controller('users')
   export class UsersController {
     constructor(private userService: UserService) {}

     @Post()
     @HttpCode(HttpStatus.CREATED)
     @ApiOperation({ summary: '创建用户' })
     async create(@Body() dto: CreateUserDto) {
       return this.userService.create(dto);
     }
   }
   ```

### 错误处理

```typescript
// 使用 NestJS 内置异常
import { NotFoundException, BadRequestException } from '@nestjs/common';

async getUser(id: number) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundException('用户不存在');
  }
  return user;
}

// 自定义业务异常
export class InsufficientStockException extends BadRequestException {
  constructor(productId: number, requested: number, available: number) {
    super(`产品 ${productId} 库存不足。请求: ${requested}, 可用: ${available}`);
  }
}
```

## Git 工作流

### 分支策略

- `main` - 主分支，始终保持稳定可部署状态
- `develop` - 开发分支，集成最新功能
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type):**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例:**

```bash
git commit -m "feat(auth): add refresh token support"

git commit -m "fix(products): resolve inventory check issue in order creation"

git commit -m "docs(api): update authentication endpoint documentation"
```

### Pull Request 流程

1. 从 `develop` 创建功能分支
2. 开发并提交代码
3. 推送到远程仓库
4. 创建 Pull Request
5. 代码审查
6. 合并到 `develop`

## 测试指南

### 单元测试

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    }).compile();

    service = module.get(UserService);
    prisma = module.get(PrismaService);
  });

  it('should create a user', async () => {
    const userData = { email: 'test@example.com', password: 'hashed' };
    prisma.user.create.mockResolvedValue({ id: 1, ...userData });

    const result = await service.create(userData);

    expect(result).toHaveProperty('id', 1);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: userData,
    });
  });
});
```

### E2E 测试

```typescript
// auth.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
      });
  });
});
```

### 运行测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 覆盖率报告
npm run test:cov

# 监听模式
npm run test:watch
```

## 调试技巧

### VS Code 调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug", "--", "--inspect-brk"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

### 日志调试

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(dto: CreateUserDto) {
    this.logger.log(`Creating user with email: ${dto.email}`);
    this.logger.debug(`User data: ${JSON.stringify(dto)}`);

    try {
      const user = await this.prisma.user.create({ data: dto });
      this.logger.log(`User created successfully with ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack);
      throw error;
    }
  }
}
```

### Prisma 查询日志

在开发环境，Prisma 会自动记录所有查询。查看控制台输出:

```
prisma:query SELECT * FROM "User" WHERE "id" = $1 LIMIT $2
```

## 性能优化

### 数据库查询优化

```typescript
// 避免 N+1 查询 - 使用 include
async getUsersWithOrders() {
  return this.prisma.user.findMany({
    include: {
      orders: true, // 一次查询获取关联数据
    },
  });
}

// 使用 select 只选择需要的字段
async getUserEmail(id: number) {
  return this.prisma.user.findUnique({
    where: { id },
    select: { email: true }, // 只返回 email 字段
  });
}

// 批量操作
async updateManyUsers(userIds: number[], data: any) {
  return this.prisma.user.updateMany({
    where: { id: { in: userIds } },
    data,
  });
}
```

### 缓存策略

```typescript
@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getProduct(id: number) {
    const cacheKey = `product:${id}`;

    // 尝试从缓存获取
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 从数据库获取
    const product = await this.prisma.product.findUnique({ where: { id } });

    // 存入缓存 (5分钟)
    await this.cache.set(cacheKey, JSON.stringify(product), 300);

    return product;
  }
}
```

## 安全最佳实践

1. **永远不要在代码中硬编码密钥**
   ```typescript
   // 错误
   const apiKey = 'sk_live_abc123...';

   // 正确
   const apiKey = process.env.STRIPE_API_KEY;
   ```

2. **验证所有用户输入**
   ```typescript
   export class CreateOrderDto {
     @IsNumber()
     @Min(1)
     productId: number;

     @IsNumber()
     @Min(1)
     @Max(100)
     quantity: number;
   }
   ```

3. **使用参数化查询 (Prisma 自动处理)**
   ```typescript
   // Prisma 自动防止 SQL 注入
   await this.prisma.user.findMany({
    where: { email: userInputEmail },
   });
   ```

4. **实施速率限制**
   ```typescript
   @Throttle({ default: { limit: 10, ttl: 60 } })
   @Post('sensitive-action')
   sensitiveAction() {
     // ...
   }
   ```

## 获取帮助

- 查看项目 [README.md](./README.md)
- 查看 [API 文档](../api-documentation.md)
- 查看数据库设计 [database-design.md](../database-design.md)
- 查看 Epic 任务 [epics.md](../epics.md)

## 相关资源

- [NestJS 官方文档](https://docs.nestjs.com)
- [Prisma 文档](https://www.prisma.io/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [JWT 最佳实践](https://jwt.io/introduction)
