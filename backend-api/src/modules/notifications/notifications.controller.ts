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
        // 退款通知可以根据需要实现
        return { success: true, message: '退款通知功能待实现' };

      case 'ORDER_STATUS':
        // 订单状态变更通知可以根据需要实现
        return { success: true, message: '订单状态通知功能待实现' };

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

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return { status: 'ok', service: 'notifications' };
  }
}
