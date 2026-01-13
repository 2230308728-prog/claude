import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '健康检查', description: '获取应用欢迎信息' })
  @ApiResponse({
    status: 200,
    description: '成功返回欢迎信息',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          example: 'Welcome to bmad API!',
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-01-09T12:00:00.000Z' },
            version: { type: 'string', example: '1.0' },
            path: { type: 'string', example: '/' },
          },
        },
      },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查端点', description: '用于负载均衡器和服务发现' })
  @ApiResponse({
    status: 200,
    description: '服务健康',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2024-01-09T12:00:00.000Z' },
            uptime: { type: 'number', example: 123.456 },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            version: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
    },
  })
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
