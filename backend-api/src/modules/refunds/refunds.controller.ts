import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { Roles, Public } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CreateRefundDto,
  ProcessRefundDto,
  QueryRefundsDto,
} from './dto';

/**
 * RefundsController - 退款控制器
 *
 * 处理退款申请、审核等
 */
@ApiTags('refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  /**
   * 创建退款申请
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建退款申请', description: '用户创建退款申请' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '退款申请创建成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  async createRefund(
    @Body() dto: CreateRefundDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.refundsService.createRefund(dto, user.id);
  }

  /**
   * 获取用户退款列表
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取退款列表', description: '用户获取自己的退款申请列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getUserRefunds(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryRefundsDto,
  ) {
    return this.refundsService.getUserRefunds(user.id, query);
  }

  /**
   * 获取退款详情
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取退款详情', description: '用户获取退款申请详细信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '退款申请不存在',
  })
  async getRefund(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.refundsService.getRefund(id, user.id);
  }

  // ============================================
  // 管理员接口
  // ============================================

  /**
   * 获取所有退款列表（管理员）
   */
  @Get('admin/all')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取所有退款列表', description: '管理员获取所有退款申请' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getAllRefunds(@Query() query: QueryRefundsDto) {
    return this.refundsService.getAllRefunds(query);
  }

  /**
   * 审核退款
   */
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '审核退款', description: '管理员审核退款申请' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '审核成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.refundsService.processRefund(id, dto);
  }

  /**
   * 微信退款回调
   */
  @Post('notify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '微信退款回调',
    description: '接收微信退款结果通知（微信服务器调用）',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '处理成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'SUCCESS' },
        message: { type: 'string', example: 'OK' },
      },
    },
  })
  async handleRefundNotify(@Body() data: any) {
    return this.refundsService.handleRefundNotify(data);
  }
}
