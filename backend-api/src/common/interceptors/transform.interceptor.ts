import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/**
 * 统一响应包装拦截器
 *
 * 将所有控制器返回的数据包装成统一的响应格式：
 * {
 *   "data": T,
 *   "meta": {
 *     "timestamp": "ISO 8601 格式时间戳",
 *     "version": "1.0",
 *     "path": "请求路径"
 *   }
 * }
 */
export interface Response<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
    path: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = request.startTime || Date.now();

    return next.handle().pipe(
      map((data) => {
        const responseTime = Date.now() - startTime;

        // 如果返回的数据已经是标准响应格式，直接返回
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return data;
        }

        // 包装成标准响应格式
        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            path: request.url,
            responseTime: responseTime < 10 ? undefined : `${responseTime}ms`,
          },
        };
      }),
    );
  }
}
