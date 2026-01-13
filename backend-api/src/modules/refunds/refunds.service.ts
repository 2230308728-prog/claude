import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { RefundStatus, OrderStatus } from '@prisma/client';
import {
  CreateRefundDto,
  ProcessRefundDto,
  QueryRefundsDto,
} from './dto';
import * as crypto from 'crypto';
import axios from 'axios';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * RefundsService - 退款服务
 *
 * 处理退款申请、审核、微信退款等
 */
@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  // 微信支付配置
  private readonly wechatPayConfig = {
    appId: process.env.WECHAT_APP_ID,
    mchid: process.env.WECHAT_PAY_MCHID,
    apiV3Key: process.env.WECHAT_PAY_APIV3_KEY,
    serialNo: process.env.WECHAT_PAY_SERIAL_NO,
    privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH,
    refundNotifyUrl: process.env.WECHAT_REFUND_NOTIFY_URL,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // 退款申请管理
  // ============================================

  /**
   * 创建退款申请
   */
  async createRefund(dto: CreateRefundDto, userId: number) {
    // 获取订单信息
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查订单状态
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('只有已支付订单才能申请退款');
    }

    // 检查是否已有退款申请
    const existingRefund = await this.prisma.refund.findFirst({
      where: {
        orderId: dto.orderId,
        status: { in: [RefundStatus.PENDING, RefundStatus.APPROVED, RefundStatus.PROCESSING] },
      },
    });

    if (existingRefund) {
      throw new BadRequestException('该订单已有退款申请在处理中');
    }

    // 验证退款金额
    const refundAmount = Number(dto.refundAmount);
    const paidAmount = Number(order.paidAmount);

    if (refundAmount > paidAmount) {
      throw new BadRequestException('退款金额不能超过已支付金额');
    }

    // 生成退款单号
    const refundNo = this.generateRefundNo();

    // 创建退款申请
    const refund = await this.prisma.refund.create({
      data: {
        refundNo,
        orderId: dto.orderId,
        userId,
        status: RefundStatus.PENDING,
        refundAmount: dto.refundAmount,
        reason: dto.reason,
        description: dto.description,
        images: dto.images || [],
      },
    });

    this.logger.log(`Refund created: ${refundNo} for order ${order.orderNo}`);
    return refund;
  }

  /**
   * 获取用户退款列表
   */
  async getUserRefunds(userId: number, query: QueryRefundsDto): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, status } = query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.refund.count({ where });

    const refunds = await this.prisma.refund.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNo: true,
            totalAmount: true,
          },
        },
      },
    });

    return {
      data: refunds,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取退款详情
   */
  async getRefund(refundId: number, userId: number) {
    const refund = await this.prisma.refund.findFirst({
      where: {
        id: refundId,
        userId,
      },
      include: {
        order: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('退款申请不存在');
    }

    return refund;
  }

  // ============================================
  // 退款审核（管理员）
  // ============================================

  /**
   * 获取所有退款列表（管理员）
   */
  async getAllRefunds(query: QueryRefundsDto): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, status } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const total = await this.prisma.refund.count({ where });

    const refunds = await this.prisma.refund.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            phone: true,
          },
        },
        order: {
          select: {
            orderNo: true,
            totalAmount: true,
          },
        },
      },
    });

    return {
      data: refunds,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 审核退款
   */
  async processRefund(refundId: number, dto: ProcessRefundDto) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!refund) {
      throw new NotFoundException('退款申请不存在');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('该退款申请已处理');
    }

    // 拒绝退款
    if (dto.status === RefundStatus.REJECTED) {
      const updated = await this.prisma.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.REJECTED,
          adminNote: dto.adminNote,
          rejectedReason: dto.rejectedReason,
          rejectedAt: new Date(),
        },
      });

      // 发送退款拒绝通知
      if (refund.user.openid) {
        this.notificationsService.sendRefundNotification(
          refund.user.openid,
          refund.order.product.title,
          String(refund.refundAmount),
          refund.refundNo,
          'REJECTED',
        ).catch((error) => {
          this.logger.error(`Failed to send refund rejection notification: ${error.message}`);
        });
      }

      this.logger.log(`Refund rejected: ${refund.refundNo}`);
      return updated;
    }

    // 批准退款
    if (dto.status === RefundStatus.APPROVED) {
      // 更新退款状态
      const updated = await this.prisma.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.APPROVED,
          adminNote: dto.adminNote,
          approvedAt: new Date(),
        },
      });

      // 发送退款批准通知
      if (refund.user.openid) {
        this.notificationsService.sendRefundNotification(
          refund.user.openid,
          refund.order.product.title,
          String(refund.refundAmount),
          refund.refundNo,
          'APPROVED',
        ).catch((error) => {
          this.logger.error(`Failed to send refund approval notification: ${error.message}`);
        });
      }

      // 调用微信退款接口
      try {
        await this.wechatPayCreateRefund(refund, refund.order);
        this.logger.log(`Refund approved and WeChat refund initiated: ${refund.refundNo}`);
      } catch (error) {
        this.logger.error(`WeChat refund failed: ${error.message}`);
        // 将退款状态更新为失败
        await this.prisma.refund.update({
          where: { id: refundId },
          data: { status: RefundStatus.FAILED },
        });
        throw new BadRequestException('微信退款失败，请稍后重试');
      }

      return updated;
    }

    throw new BadRequestException('无效的审核状态');
  }

  /**
   * 处理微信退款回调
   */
  async handleRefundNotify(data: any) {
    this.logger.log(`Refund notify received: ${JSON.stringify(data)}`);

    const { out_refund_no, refund_status } = data.resource || {};

    // 查找退款记录
    const refund = await this.prisma.refund.findUnique({
      where: { refundNo: out_refund_no },
      include: {
        order: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!refund) {
      this.logger.error(`Refund not found: ${out_refund_no}`);
      return { code: 'FAIL', message: '退款记录不存在' };
    }

    // 更新退款状态
    if (refund_status === 'SUCCESS') {
      if (refund.status === RefundStatus.COMPLETED) {
        return { code: 'SUCCESS', message: 'OK' };
      }

      await this.prisma.$transaction(async (tx) => {
        // 更新退款状态
        await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: RefundStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // 更新订单状态
        await tx.order.update({
          where: { id: refund.orderId },
          data: { status: OrderStatus.REFUNDED },
        });

        // 恢复库存
        await tx.product.update({
          where: { id: refund.order.productId },
          data: { stock: { increment: refund.order.participantCount } },
        });
      });

      // 发送退款完成通知
      if (refund.user.openid) {
        this.notificationsService.sendRefundNotification(
          refund.user.openid,
          refund.order.product.title,
          String(refund.refundAmount),
          refund.refundNo,
          'COMPLETED',
        ).catch((error) => {
          this.logger.error(`Failed to send refund completion notification: ${error.message}`);
        });
      }

      this.logger.log(`Refund completed: ${out_refund_no}`);
    } else if (refund_status === 'FAILED') {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: { status: RefundStatus.FAILED },
      });

      // 发送退款失败通知
      if (refund.user.openid) {
        this.notificationsService.sendRefundNotification(
          refund.user.openid,
          refund.order.product.title,
          String(refund.refundAmount),
          refund.refundNo,
          'FAILED',
        ).catch((error) => {
          this.logger.error(`Failed to send refund failure notification: ${error.message}`);
        });
      }
    }

    return { code: 'SUCCESS', message: 'OK' };
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 生成退款单号
   */
  private generateRefundNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `REF${dateStr}${timeStr}${random}`;
  }

  /**
   * 微信支付退款
   */
  private async wechatPayCreateRefund(refund: any, order: any) {
    const url = 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds';

    const params = {
      out_trade_no: order.orderNo,
      out_refund_no: refund.refundNo,
      reason: refund.reason,
      amount: {
        refund: Math.round(Number(refund.refundAmount) * 100), // 转换为分
        total: Math.round(Number(order.totalAmount) * 100),
        currency: 'CNY',
      },
      notify_url: this.wechatPayConfig.refundNotifyUrl,
    };

    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: this.generateAuthorizationHeader('POST', url, params),
      },
    });

    // 更新微信退款单号
    if (response.data.refund_id) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: { wechatRefundId: response.data.refund_id },
      });
    }

    return response.data;
  }

  /**
   * 生成微信支付 Authorization 头
   */
  private generateAuthorizationHeader(
    method: string,
    url: string,
    body: any,
  ): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = this.generateNonceStr();
    const bodyStr = Object.keys(body).length > 0 ? JSON.stringify(body) : '';

    const signStr = [method, url, timestamp, nonceStr, bodyStr].join('\n');

    // 这里需要使用商户私钥进行签名
    // 简化实现，实际需要读取私钥文件
    const signature = crypto
      .createHmac('SHA256', this.wechatPayConfig.apiV3Key || '')
      .update(signStr)
      .digest('hex');

    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.wechatPayConfig.mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.wechatPayConfig.serialNo}"`;
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
