import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware - 请求日志中间件
 *
 * 记录所有 HTTP 请求的详细信息
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // 记录请求开始
    this.logger.log(
      `[${method}] ${url} - ${ip} - ${userAgent}`,
    );

    // 监听响应完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // 根据状态码决定日志级别
      const message = `[${method}] ${url} - ${statusCode} - ${duration}ms - ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}

/**
 * 扩展 Request 接口，添加请求开始时间
 */
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

/**
 * TransformMiddleware - 请求转换中间件
 *
 * 添加请求开始时间，用于计算请求处理时长
 */
@Injectable()
export class TransformMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req.startTime = Date.now();
    next();
  }
}
