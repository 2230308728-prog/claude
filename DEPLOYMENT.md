# bmad 项目部署指南

本文档提供 bmad 研学商城平台的完整部署指南，包括后端 API 和管理后台的部署。

## 目录

- [系统要求](#系统要求)
- [本地部署](#本地部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 系统要求

### 后端 API
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9.0.0

### 管理后台
- Node.js >= 18.0.0
- npm >= 9.0.0

## 本地部署

### 1. 数据库设置

#### PostgreSQL 安装

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb bmad
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb bmad
```

#### Redis 安装

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### 2. 后端 API 部署

```bash
# 进入后端目录
cd backend-api

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充种子数据（开发环境）
npm run prisma:seed

# 启动开发服务器
npm run start:dev

# 生产环境构建
npm run build
npm run start:prod
```

### 3. 管理后台部署

```bash
# 进入管理后台目录
cd admin-dashboard

# 安装依赖
npm install

# 配置环境变量
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1" > .env.local

# 启动开发服务器
npm run dev

# 生产环境构建
npm run build
npm run start
```

### 4. 访问应用

- 后端 API: http://localhost:3000/api/v1
- API 文档: http://localhost:3000/api/v1/docs
- 管理后台: http://localhost:3002
- 健康检查: http://localhost:3000/api/v1/health

## 生产环境部署

### 后端 API 部署

#### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 构建应用
npm run build

# 启动应用
pm2 start dist/main.js --name bmad-api

# 配置自动重启
pm2 startup
pm2 save

# 查看日志
pm2 logs bmad-api
```

#### 使用 systemd (Linux)

创建 `/etc/systemd/system/bmad-api.service`:

```ini
[Unit]
Description=bmad API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bmad/backend-api
ExecStart=/usr/bin/node dist/main.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bmad-api
sudo systemctl start bmad-api
sudo systemctl status bmad-api
```

### 管理后台部署

#### 构建生产版本

```bash
cd admin-dashboard
npm run build
```

#### 使用 PM2

```bash
pm2 start npm --name "bmad-admin" -- start
```

#### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name admin.bmad.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 数据库迁移

```bash
# 生产环境运行迁移
npm run prisma:deploy
```

## Docker 部署

### Docker Compose 配置

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bmad
      POSTGRES_USER: bmad
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build: ./backend-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://bmad:your_password@postgres:5432/bmad?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - postgres
      - redis
    command: sh -c "npx prisma migrate deploy && npm run start:prod"

  admin:
    build: ./admin-dashboard
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000/api/v1
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

启动:
```bash
docker-compose up -d
```

## 环境变量配置

### 后端 API (.env)

```bash
# 应用配置
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/bmad?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-production-secret-key-change-this
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# 微信小程序
WECHAT_APP_ID=your_wechat_appid
WECHAT_APP_SECRET=your_wechat_secret

# 微信支付
WECHAT_PAY_MCHID=your_merchant_id
WECHAT_PAY_APIV3_KEY=your_apiv3_key
WECHAT_PAY_SERIAL_NO=your_serial_no
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/private_key.pem

# 阿里云 OSS
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=bmad-storage
```

### 管理后台 (.env.local / .env.production)

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

## SSL/TLS 配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d admin.bmad.com

# 自动续期
sudo certbot renew --dry-run
```

## 监控和日志

### 日志管理

```bash
# PM2 日志
pm2 logs

# 系统日志
sudo journalctl -u bmad-api -f
```

### 性能监控

```bash
# PM2 监控
pm2 monit
```

## 常见问题

### 1. 数据库连接失败

检查 `.env` 中的 `DATABASE_URL` 是否正确，PostgreSQL 服务是否运行。

### 2. Redis 连接失败

检查 Redis 服务状态: `redis-cli ping`

### 3. 端口被占用

```bash
# 查找占用端口的进程
lsof -ti:3000

# 杀死进程
kill -9 $(lsof -ti:3000)
```

### 4. Prisma 迁移失败

```bash
# 重置数据库
npm run prisma:reset

# 重新生成客户端
npm run prisma:generate
```

### 5. 管理后台无法连接 API

检查 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正确。

## 安全检查清单

- [ ] 修改所有默认密码
- [ ] 配置强密码策略
- [ ] 启用 HTTPS
- [ ] 配置防火墙
- [ ] 定期备份数据库
- [ ] 监控日志文件
- [ ] 更新依赖包
- [ ] 配置 CORS 策略

## 备份策略

### 数据库备份

```bash
# 手动备份
pg_dump -U username bmad > backup_$(date +%Y%m%d).sql

# 恢复备份
psql -U username bmad < backup_20250113.sql
```

### 自动备份脚本

```bash
#!/bin/bash
# /usr/local/bin/backup-bmad.sh

BACKUP_DIR="/var/backups/bmad"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U username bmad > $BACKUP_DIR/backup_$DATE.sql

# 保留最近7天的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

添加到 crontab:
```bash
0 2 * * * /usr/local/bin/backup-bmad.sh
```

## 更新部署

### 后端更新

```bash
cd backend-api
git pull
npm install
npm run build
npm run prisma:migrate
pm2 restart bmad-api
```

### 管理后台更新

```bash
cd admin-dashboard
git pull
npm install
npm run build
pm2 restart bmad-admin
```

## 支持

如有问题，请联系技术支持或查看项目文档。
