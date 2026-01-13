import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { ProductsService } from '../products/products.service';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStatus } from '@prisma/client';
import {
  CreateOrderDto,
  QueryOrdersDto,
  CreatePaymentDto,
} from './dto';
import * as crypto from 'crypto';
import axios from 'axios';

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
 * OrdersService - 订单服务
 *
 * 处理订单创建、支付、查询等
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  // 微信支付配置
  private readonly wechatPayConfig = {
    appId: process.env.WECHAT_APP_ID,
    mchid: process.env.WECHAT_PAY_MCHID,
    apiV3Key: process.env.WECHAT_PAY_APIV3_KEY,
    serialNo: process.env.WECHAT_PAY_SERIAL_NO,
    privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly productsService: ProductsService,
    private readonly couponsService: CouponsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // 订单管理
  // ============================================

  /**
   * 创建订单
   */
  async createOrder(dto: CreateOrderDto, userId: number) {
    // 获取产品信息
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    if (product.status !== 'PUBLISHED') {
      throw new BadRequestException('产品未上架');
    }

    if (product.stock < 1) {
      throw new BadRequestException('产品库存不足');
    }

    // 检查年龄限制
    if (product.minAge && dto.childAge < product.minAge) {
      throw new BadRequestException(`儿童年龄不能小于${product.minAge}岁`);
    }

    if (product.maxAge && dto.childAge > product.maxAge) {
      throw new BadRequestException(`儿童年龄不能大于${product.maxAge}岁`);
    }

    // 生成订单号
    const orderNo = this.generateOrderNo();

    // 计算总金额
    const participantCount = dto.participantCount || 1;
    let totalAmount = Number(product.price) * participantCount;
    let discount = 0;
    let couponData = null;

    // 如果提供了优惠券ID，验证并计算折扣
    if (dto.couponId) {
      try {
        const validationResult = await this.couponsService.validateCoupon(
          userId,
          dto.couponId,
          totalAmount,
          dto.productId,
        );
        discount = validationResult.discount;
        totalAmount = validationResult.newTotal;
        couponData = validationResult.coupon;
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    // 创建订单
    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          productId: dto.productId,
          status: OrderStatus.PENDING,
          totalAmount: totalAmount.toFixed(2),
          paidAmount: '0.00',
          childName: dto.childName,
          childAge: dto.childAge,
          contactPhone: dto.contactPhone,
          contactName: dto.contactName,
          bookingDate: new Date(dto.bookingDate),
          participantCount,
          remark: dto.remark,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              duration: true,
              location: true,
            },
          },
        },
      });

      // 如果使用了优惠券，创建订单优惠券关联记录
      if (dto.couponId && discount > 0) {
        await tx.orderCoupon.create({
          data: {
            orderId: order.id,
            couponId: dto.couponId,
            discount,
          },
        });

        // 标记优惠券为已使用
        await tx.userCoupon.update({
          where: {
            userId_couponId: {
              userId,
              couponId: dto.couponId,
            },
          },
          data: {
            status: 'USED',
            usedAt: new Date(),
          },
        });
      }

      return order;
    });

    this.logger.log(`Order created: ${orderNo} for user ${userId} with discount: ${discount}`);
    return order;
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId: number, query: QueryOrdersDto): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, status, orderNo } = query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }

    const total = await this.prisma.order.count({ where });

    const orders = await this.prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
            duration: true,
            location: true,
          },
        },
      },
    });

    return {
      data: orders,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取订单详情
   */
  async getOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  /**
   * 根据订单号获取订单详情
   */
  async getOrderByNo(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        product: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只有待支付订单可以取消');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // 恢复库存
    await this.prisma.product.update({
      where: { id: order.productId },
      data: { stock: { increment: order.participantCount } },
    });

    // 发送订单取消通知
    if (order.user.openid) {
      this.notificationsService.sendOrderStatusNotification(
        order.user.openid,
        order.product.title,
        order.orderNo,
        'CANCELLED',
        '订单已取消',
      ).catch((error) => {
        this.logger.error(`Failed to send order cancellation notification: ${error.message}`);
      });
    }

    this.logger.log(`Order cancelled: ${order.orderNo} by user ${userId}`);
    return updated;
  }

  // ============================================
  // 支付相关
  // ============================================

  /**
   * 创建支付
   */
  async createPayment(dto: CreatePaymentDto, userId: number) {
    const orderId = parseInt(dto.orderId);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不正确');
    }

    // 获取用户 openid
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.openid) {
      throw new BadRequestException('用户未绑定微信，无法支付');
    }

    // 调用微信支付统一下单接口
    const paymentParams = await this.wechatPayCreateOrder({
      description: order.product.title,
      outTradeNo: order.orderNo,
      amount: {
        total: Math.round(Number(order.totalAmount) * 100), // 转换为分
        currency: 'CNY',
      },
      payer: {
        openid: user.openid,
      },
    });

    this.logger.log(`Payment created for order: ${order.orderNo}`);

    return {
      prepayId: paymentParams.prepay_id,
      // 小程序支付需要的参数
      ...this.buildMiniProgramPayParams(paymentParams.prepay_id),
    };
  }

  /**
   * 处理微信支付回调
   */
  async handlePaymentNotify(data: any) {
    this.logger.log(`Payment notify received: ${JSON.stringify(data)}`);

    const { out_trade_no, trade_state, transaction_id, amount } = data.resource || {};

    if (trade_state !== 'SUCCESS') {
      this.logger.warn(`Payment not successful: ${trade_state}`);
      return { code: 'FAIL', message: '支付未成功' };
    }

    // 查找订单
    const order = await this.prisma.order.findUnique({
      where: { orderNo: out_trade_no },
      include: {
        product: true,
        user: true,
      },
    });

    if (!order) {
      this.logger.error(`Order not found: ${out_trade_no}`);
      return { code: 'FAIL', message: '订单不存在' };
    }

    if (order.status === OrderStatus.PAID) {
      this.logger.log(`Order already paid: ${out_trade_no}`);
      return { code: 'SUCCESS', message: 'OK' };
    }

    // 更新订单状态
    await this.prisma.$transaction(async (tx) => {
      // 更新订单
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAmount: (amount?.total / 100).toFixed(2),
          paidAt: new Date(),
        },
      });

      // 减少库存
      await tx.product.update({
        where: { id: order.productId },
        data: {
          stock: { decrement: order.participantCount },
          bookingCount: { increment: 1 },
        },
      });
    });

    // 发送订单支付成功通知
    if (order.user.openid) {
      this.notificationsService.sendOrderStatusNotification(
        order.user.openid,
        order.product.title,
        order.orderNo,
        'PAID',
        '订单已支付',
      ).catch((error) => {
        this.logger.error(`Failed to send order payment notification: ${error.message}`);
      });
    }

    this.logger.log(`Order paid successfully: ${out_trade_no}`);

    return { code: 'SUCCESS', message: 'OK' };
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 如果已经是支付状态，直接返回
    if (order.status === OrderStatus.PAID) {
      return {
        paid: true,
        paidAt: order.paidAt,
        paidAmount: order.paidAmount,
      };
    }

    // 查询微信支付状态
    try {
      const result = await this.wechatPayQueryOrder(orderNo);

      if (result.trade_state === 'SUCCESS') {
        // 更新订单状态
        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.PAID,
              paidAmount: (result.amount.total / 100).toFixed(2),
              paidAt: new Date(),
            },
          });

          await tx.product.update({
            where: { id: order.productId },
            data: {
              stock: { decrement: order.participantCount },
              bookingCount: { increment: 1 },
            },
          });
        });

        return {
          paid: true,
          paidAt: new Date(),
          paidAmount: (result.amount.total / 100).toFixed(2),
        };
      }

      return {
        paid: false,
        tradeState: result.trade_state,
      };
    } catch (error) {
      this.logger.error('Query payment status failed', error);
      return {
        paid: false,
        error: '查询支付状态失败',
      };
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${dateStr}${timeStr}${random}`;
  }

  /**
   * 微信支付统一下单
   */
  private async wechatPayCreateOrder(params: any) {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';

    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: this.generateAuthorizationHeader(
          'POST',
          url,
          params,
        ),
      },
    });

    return response.data;
  }

  /**
   * 查询微信支付订单
   */
  private async wechatPayQueryOrder(outTradeNo: string) {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outTradeNo}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: this.generateAuthorizationHeader('GET', url, {}),
      },
    });

    return response.data;
  }

  /**
   * 生成小程序支付参数
   */
  private buildMiniProgramPayParams(prepayId: string) {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;

    const signStr = [
      this.wechatPayConfig.appId,
      timeStamp,
      nonceStr,
      packageStr,
      '',
    ].join('\n');

    const sign = crypto
      .createHmac('SHA256', this.wechatPayConfig.apiV3Key || '')
      .update(signStr)
      .digest('hex');

    return {
      appId: this.wechatPayConfig.appId,
      timeStamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign: sign,
    };
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

    const signStr = [
      method,
      url,
      timestamp,
      nonceStr,
      bodyStr,
    ].join('\n');

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
