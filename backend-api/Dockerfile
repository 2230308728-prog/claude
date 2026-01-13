# ============================================
# 多阶段构建 Dockerfile
# Stage 1: 构建
# Stage 2: 运行
# ============================================

# ============================================
# Stage 1: 构建
# ============================================
FROM node:20-alpine AS builder

# 设置构建参数
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 设置工作目录
WORKDIR /app

# 安装 Prisma CLI (全局)
RUN npm install -g prisma

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖 (包括 devDependencies，用于构建)
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# ============================================
# Stage 2: 运行
# ============================================
FROM node:20-alpine AS runner

# 设置运行时参数
ARG NODE_ENV=production
ARG PORT=3000
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 复制必要文件
COPY package*.json ./
COPY prisma ./prisma/

# 仅安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从 builder 阶段复制构建产物和生成的 Prisma Client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 更改文件所有者
RUN chown -R nestjs:nodejs /app

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if(r.statusCode !== 200) process.exit(1)})"

# 启动应用
CMD ["node", "dist/main"]
