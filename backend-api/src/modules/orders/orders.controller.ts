import {
  Controller,
  Get,
  Post,
  Put,
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
import { OrdersService } from './orders.service';
import { Roles, Public } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CreateOrderDto,
  QueryOrdersDto,
  CreatePaymentDto,
} from './dto';

/**
 * OrdersController - 订单控制器
 *
 * 处理订单和支付相关的 HTTP 请求
 */
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 创建订单
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建订单', description: '用户创建新订单' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '订单创建成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.createOrder(dto, user.id);
  }

  /**
   * 获取用户订单列表
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取订单列表', description: '用户获取自己的订单列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getUserOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryOrdersDto,
  ) {
    return this.ordersService.getUserOrders(user.id, query);
  }

  /**
   * 获取订单详情
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取订单详情', description: '用户获取订单详细信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '订单不存在',
  })
  async getOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.getOrder(id, user.id);
  }

  /**
   * 取消订单
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '取消订单', description: '用户取消待支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '取消成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '订单状态不允许取消',
  })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.cancelOrder(id, user.id);
  }

  // ============================================
  // 支付相关
  // ============================================

  /**
   * 创建支付
   */
  @Post('payments/create')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建支付', description: '为订单创建微信支付' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '支付创建成功，返回支付参数',
    schema: {
      type: 'object',
      properties: {
        prepayId: { type: 'string' },
        appId: { type: 'string' },
        timeStamp: { type: 'string' },
        nonceStr: { type: 'string' },
        package: { type: 'string' },
        signType: { type: 'string' },
        paySign: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '订单状态不正确',
  })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.createPayment(dto, user.id);
  }

  /**
   * 查询支付状态
   */
  @Get('payments/:orderNo/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '查询支付状态', description: '查询订单的支付状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        paid: { type: 'boolean' },
        paidAt: { type: 'string', format: 'date-time' },
        paidAmount: { type: 'string' },
      },
    },
  })
  async queryPaymentStatus(@Param('orderNo') orderNo: string) {
    return this.ordersService.queryPaymentStatus(orderNo);
  }

  /**
   * 微信支付回调
   */
  @Post('payments/notify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '微信支付回调',
    description: '接收微信支付结果通知（微信服务器调用）',
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
  async handlePaymentNotify(@Body() data: any) {
    return this.ordersService.handlePaymentNotify(data);
  }
}
