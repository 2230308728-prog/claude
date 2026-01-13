import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

/**
 * 定时任务服务 - 负责发送出行前24小时提醒
 */
@Injectable()
export class ReminderTaskService {
  private readonly logger = new Logger(ReminderTaskService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 每小时执行一次，检查需要发送提醒的订单
   * 订单状态为PAID或CONFIRMED，出行时间在24小时内且未发送提醒
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleReminders() {
    try {
      this.logger.log('开始检查需要发送提醒的订单...');

      // 计算24小时后的时间
      const now = new Date();
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 查询符合条件的订单
      const orders = await this.prisma.order.findMany({
        where: {
          status: 'PAID',
          bookingDate: {
            gte: now,
            lte: twentyFourHoursLater,
          },
          reminderSent: false,
        },
        include: {
          user: {
            select: {
              id: true,
              openid: true,
              nickname: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      });

      this.logger.log(`找到 ${orders.length} 个需要发送提醒的订单`);

      let successCount = 0;
      let failCount = 0;

      for (const order of orders) {
        try {
          if (!order.user.openid) {
            this.logger.warn(
              `订单 ${order.orderNo} 的用户没有openid，跳过发送提醒`,
            );
            failCount++;
            continue;
          }

          const result = await this.notificationsService.sendReminderNotification(
            order.user.openid,
            order.product.title,
            order.bookingDate.toISOString().split('T')[0],
            order.product.location || '待定',
            order.orderNo,
          );

          if (result.success) {
            // 标记提醒已发送
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                reminderSent: true,
                reminderSentAt: new Date(),
              },
            });
            successCount++;
            this.logger.log(`订单 ${order.orderNo} 提醒发送成功`);
          } else {
            failCount++;
            this.logger.error(
              `订单 ${order.orderNo} 提醒发送失败: ${result.error}`,
            );
          }
        } catch (error) {
          failCount++;
          this.logger.error(
            `处理订单 ${order.orderNo} 时出错: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `提醒任务完成: 成功 ${successCount} 个, 失败 ${failCount} 个`,
      );
    } catch (error) {
      this.logger.error('检查提醒任务时发生错误', error);
    }
  }

  /**
   * 手动触发提醒检查（用于测试）
   */
  async triggerRemindersManually() {
    this.logger.log('手动触发提醒检查任务');
    await this.handleReminders();
  }
}
