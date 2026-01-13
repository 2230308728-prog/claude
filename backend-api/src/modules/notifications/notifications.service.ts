import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly accessToken: string | null = null;
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('WECHAT_APP_ID') || '';
    this.appSecret = this.configService.get<string>('WECHAT_APP_SECRET') || '';
  }

  /**
   * 获取微信access_token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`
      );

      if (response.data.errcode !== 0) {
        throw new Error(`获取access_token失败: ${response.data.errmsg}`);
      }

      return response.data.access_token;
    } catch (error) {
      this.logger.error('获取access_token失败', error);
      throw error;
    }
  }

  /**
   * 发送订阅消息
   */
  async sendSubscribeMessage(openid: string, templateId: string, data: any, page?: string) {
    try {
      const accessToken = await this.getAccessToken();

      const requestData = {
        touser: openid,
        template_id: templateId,
        page: page,
        data: this.formatTemplateData(data),
        miniprogram_state: 'formal'
      };

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        requestData
      );

      if (response.data.errcode !== 0) {
        this.logger.error(`发送订阅消息失败: ${response.data.errmsg}`, response.data);
        return { success: false, error: response.data.errmsg };
      }

      this.logger.log(`订阅消息发送成功: openid=${openid}, template=${templateId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('发送订阅消息失败', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 格式化模板数据
   */
  private formatTemplateData(data: Record<string, any>): Record<string, any> {
    const formatted: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      formatted[key] = {
        value: String(value)
      };
    }

    return formatted;
  }

  /**
   * 发送出行提醒通知
   */
  async sendReminderNotification(
    openid: string,
    productName: string,
    bookingDate: string,
    location: string,
    orderId: string
  ) {
    // 注意：这里需要使用实际的模板ID，需要在微信公众平台申请
    const templateId = this.configService.get<string>('WECHAT_TEMPLATE_REMINDER') || '';

    if (!templateId) {
      this.logger.warn('未配置出行提醒模板ID，跳过发送');
      return { success: false, error: '未配置模板ID' };
    }

    const data = {
      thing1: productName,
      date2: bookingDate,
      thing3: location,
      character_string4: orderId
    };

    return this.sendSubscribeMessage(
      openid,
      templateId,
      data,
      `pages/order/order?id=${orderId}`
    );
  }

  /**
   * 发送订单确认通知
   */
  async sendOrderConfirmationNotification(
    openid: string,
    productName: string,
    bookingDate: string,
    orderNo: string,
    totalAmount: string
  ) {
    const templateId = this.configService.get<string>('WECHAT_TEMPLATE_ORDER_CONFIRM') || '';

    if (!templateId) {
      this.logger.warn('未配置订单确认模板ID，跳过发送');
      return { success: false, error: '未配置模板ID' };
    }

    const data = {
      thing1: productName,
      date2: bookingDate,
      character_string3: orderNo,
      amount4: totalAmount
    };

    return this.sendSubscribeMessage(
      openid,
      templateId,
      data,
      `pages/order/order?id=${orderNo}`
    );
  }

  /**
   * 发送退款通知
   */
  async sendRefundNotification(
    openid: string,
    productName: string,
    refundAmount: string,
    refundNo: string,
    refundStatus: 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'FAILED'
  ) {
    const templateId = this.configService.get<string>('WECHAT_TEMPLATE_REFUND') || '';

    if (!templateId) {
      this.logger.warn('未配置退款模板ID，跳过发送');
      return { success: false, error: '未配置模板ID' };
    }

    // 状态映射
    const statusMap: Record<string, string> = {
      'APPROVED': '退款已批准',
      'REJECTED': '退款已拒绝',
      'COMPLETED': '退款已完成',
      'FAILED': '退款失败'
    };

    const data = {
      thing1: productName,
      amount2: refundAmount,
      character_string3: refundNo,
      phrase4: statusMap[refundStatus] || refundStatus
    };

    return this.sendSubscribeMessage(
      openid,
      templateId,
      data,
      `pages/order/order?id=${refundNo}`
    );
  }

  /**
   * 发送订单状态变更通知
   */
  async sendOrderStatusNotification(
    openid: string,
    productName: string,
    orderNo: string,
    status: string,
    statusText?: string
  ) {
    const templateId = this.configService.get<string>('WECHAT_TEMPLATE_ORDER_STATUS') || '';

    if (!templateId) {
      this.logger.warn('未配置订单状态模板ID，跳过发送');
      return { success: false, error: '未配置模板ID' };
    }

    // 状态文本映射
    const statusTextMap: Record<string, string> = {
      'PAID': '订单已支付',
      'CANCELLED': '订单已取消',
      'COMPLETED': '订单已完成',
      'REFUNDED': '订单已退款'
    };

    const finalStatusText = statusText || statusTextMap[status] || status;

    const data = {
      thing1: productName,
      character_string2: orderNo,
      phrase3: finalStatusText,
      date4: new Date().toLocaleDateString('zh-CN')
    };

    return this.sendSubscribeMessage(
      openid,
      templateId,
      data,
      `pages/order/order?id=${orderNo}`
    );
  }
}
