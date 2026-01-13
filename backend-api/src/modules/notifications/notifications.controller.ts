import { Controller, Post, Body, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto, SubscribeMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '手动发送通知（管理员）' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    // 根据用户ID获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, openid: true, nickname: true },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (!user.openid) {
      throw new BadRequestException('用户未绑定微信，无法发送通知');
    }

    // 根据通知类型发送不同的通知
    switch (dto.type) {
      case 'ORDER_CONFIRM':
        return this.notificationsService.sendOrderConfirmationNotification(
          user.openid,
          dto.data.productName,
          dto.data.bookingDate,
          dto.data.orderNo,
          dto.data.totalAmount,
        );

      case 'REMINDER':
        return this.notificationsService.sendReminderNotification(
          user.openid,
          dto.data.productName,
          dto.data.bookingDate,
          dto.data.location,
          dto.data.orderId,
        );

      case 'REFUND':
        return this.notificationsService.sendRefundNotification(
          user.openid,
          dto.data.productName,
          dto.data.refundAmount,
          dto.data.refundNo,
          dto.data.refundStatus,
        );

      case 'ORDER_STATUS':
        return this.notificationsService.sendOrderStatusNotification(
          user.openid,
          dto.data.productName,
          dto.data.orderNo,
          dto.data.status,
          dto.data.statusText,
        );

      default:
        throw new BadRequestException(`不支持的通知类型: ${dto.type}`);
    }
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发送订阅消息（管理员）' })
  async sendSubscribeMessage(@Body() dto: SubscribeMessageDto) {
    return this.notificationsService.sendSubscribeMessage(
      dto.openid,
      dto.templateId,
      dto.data,
      dto.page
    );
  }

  @Post('test-reminder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '测试提醒通知（管理员）' })
  async testReminder(@Body() data: {
    openid: string;
    productName: string;
    bookingDate: string;
    location: string;
    orderId: string;
  }) {
    return this.notificationsService.sendReminderNotification(
      data.openid,
      data.productName,
      data.bookingDate,
      data.location,
      data.orderId
    );
  }

  @Post('test-refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '测试退款通知（管理员）' })
  async testRefund(@Body() data: {
    openid: string;
    productName: string;
    refundAmount: string;
    refundNo: string;
    refundStatus: 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'FAILED';
  }) {
    return this.notificationsService.sendRefundNotification(
      data.openid,
      data.productName,
      data.refundAmount,
      data.refundNo,
      data.refundStatus
    );
  }

  @Post('test-order-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '测试订单状态通知（管理员）' })
  async testOrderStatus(@Body() data: {
    openid: string;
    productName: string;
    orderNo: string;
    status: string;
    statusText?: string;
  }) {
    return this.notificationsService.sendOrderStatusNotification(
      data.openid,
      data.productName,
      data.orderNo,
      data.status,
      data.statusText || undefined
    );
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return { status: 'ok', service: 'notifications' };
  }
}
