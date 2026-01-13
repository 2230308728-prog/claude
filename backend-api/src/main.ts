import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ThrottlerGuard } from './common/guards/throttler.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CacheService } from './common/cache/cache.service';
import { Request, Response, NextFunction } from 'express';

/**
 * Bootstrap - 应用启动入口
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 应用全局前缀
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(apiPrefix);

  // 启用 CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // 应用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 如果有未定义的属性则抛出错误
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 应用全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 应用全局守卫
  app.useGlobalGuards(new ThrottlerGuard(app.get('Reflector'), app.get(CacheService)));

  // 应用全局拦截器（统一响应包装）
  app.useGlobalInterceptors(new TransformInterceptor());

  // 配置 Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('bmad API')
    .setDescription('研学产品预订平台后端 API')
    .setVersion('1.0')
    .addTag('auth', '认证相关接口')
    .addTag('products', '产品相关接口')
    .addTag('orders', '订单相关接口')
    .addTag('payments', '支付相关接口')
    .addTag('refunds', '退款相关接口')
    .addTag('notifications', '通知相关接口')
    .addTag('users', '用户相关接口')
    .addTag('admin', '管理员相关接口')
    .addTag('dashboard', '数据看板相关接口')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '请输入 JWT token',
        in: 'header',
      },
      'JWT-auth', // 这个名称将在 @ApiBearerAuth() 中使用
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 持久化认证信息
      tagsSorter: 'alpha', // 按字母顺序排序标签
      operationsSorter: 'alpha', // 按字母顺序排序操作
    },
    customSiteTitle: 'bmad API Docs',
  });

  // 应用中间件
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.startTime = Date.now();
    next();
  });
  app.use(LoggerMiddleware.prototype.use.bind(new LoggerMiddleware()));

  // 启动服务器
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}${apiPrefix}`);
  logger.log(`API Documentation: http://localhost:${port}/api-docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
