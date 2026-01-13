import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto, QueryCouponsDto } from './dto';
import { CouponStatus } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取优惠券列表
   */
  async findAll(query: QueryCouponsDto) {
    const { page = 1, pageSize = 20, keyword, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    // 状态筛选
    if (status) {
      const now = new Date();
      switch (status) {
        case 'ACTIVE':
          where.isEnabled = true;
          where.validFrom = { lte: now };
          where.validUntil = { gte: now };
          break;
        case 'EXPIRED':
          where.OR = [{ validUntil: { lt: now } }, { isEnabled: false }];
          break;
        case 'DISABLED':
          where.isEnabled = false;
          break;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取优惠券详情
   */
  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    return coupon;
  }

  /**
   * 创建优惠券
   */
  async create(createCouponDto: CreateCouponDto) {
    const {
      validFrom,
      validUntil,
      totalQuantity,
      limitPerUser,
      type,
      value,
      minAmount,
      maxDiscount,
    } = createCouponDto;

    // 验证日期
    if (new Date(validFrom) >= new Date(validUntil)) {
      throw new BadRequestException('有效期开始时间必须早于结束时间');
    }

    // 验证折扣值
    if (type === 'PERCENT' && (value <= 0 || value > 100)) {
      throw new BadRequestException('折扣百分比必须在0-100之间');
    }

    if (type === 'AMOUNT' && value <= 0) {
      throw new BadRequestException('折扣金额必须大于0');
    }

    // 验证最低消费
    if (minAmount && maxDiscount && type === 'PERCENT') {
      const maxDiscountAmount = (Number(minAmount) * Number(value)) / 100;
      if (Number(maxDiscount) > maxDiscountAmount && Number(maxDiscount) < Number(minAmount)) {
        // 如果最大优惠金额小于最低消费，这是合理的
        // 如果最大优惠金额大于计算出的最大折扣，这就不合理了
      }
    }

    return this.prisma.coupon.create({
      data: {
        ...createCouponDto,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    });
  }

  /**
   * 更新优惠券
   */
  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.findOne(id);

    // 检查是否已领取
    if (coupon.claimedQuantity > 0) {
      // 限制只能修改部分字段
      const allowedFields = ['description', 'isEnabled'];
      const updates = Object.keys(updateCouponDto).filter(
        (key) => !allowedFields.includes(key),
      );

      if (updates.length > 0) {
        throw new BadRequestException(
          '优惠券已被领取，只能修改描述和启用状态',
        );
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: updateCouponDto,
    });
  }

  /**
   * 删除优惠券
   */
  async remove(id: number) {
    const coupon = await this.findOne(id);

    if (coupon.claimedQuantity > 0) {
      throw new BadRequestException('优惠券已被领取，无法删除');
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  /**
   * 领取优惠券
   */
  async claimCoupon(userId: number, couponId: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 检查优惠券状态
    if (!coupon.isEnabled) {
      throw new BadRequestException('优惠券已停用');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestException('优惠券不在有效期内');
    }

    // 检查库存
    if (coupon.claimedQuantity >= coupon.totalQuantity) {
      throw new BadRequestException('优惠券已领完');
    }

    // 检查用户是否已领取
    const existing = await this.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('您已领取过该优惠券');
    }

    // 检查用户领取数量限制
    const userClaimCount = await this.prisma.userCoupon.count({
      where: {
        userId,
        couponId,
      },
    });

    if (userClaimCount >= coupon.limitPerUser) {
      throw new BadRequestException(
        `每人限领${coupon.limitPerUser}张，您已达上限`,
      );
    }

    // 领取优惠券
    await this.prisma.$transaction(async (tx) => {
      // 创建用户优惠券记录
      await tx.userCoupon.create({
        data: {
          userId,
          couponId,
          status: 'AVAILABLE',
          expiresAt: coupon.validUntil,
        },
      });

      // 更新优惠券已领取数量
      await tx.coupon.update({
        where: { id: couponId },
        data: {
          claimedQuantity: {
            increment: 1,
          },
        },
      });
    });

    return this.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
      include: {
        coupon: true,
      },
    });
  }

  /**
   * 获取用户的优惠券列表
   */
  async getUserCoupons(userId: number, status?: string) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const userCoupons = await this.prisma.userCoupon.findMany({
      where,
      include: {
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 过滤过期的优惠券
    const now = new Date();
    return userCoupons.filter((uc) => {
      if (uc.status === 'USED' || uc.status === 'EXPIRED') {
        return true;
      }
      // 对于可用的优惠券，检查是否过期
      if (uc.expiresAt < now) {
        return false;
      }
      return true;
    });
  }

  /**
   * 验证优惠券并计算折扣（用于订单创建前预览）
   */
  async validateCoupon(userId: number, couponId: number, orderAmount: number, productId: number) {
    const userCoupon = await this.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
      include: {
        coupon: true,
      },
    });

    if (!userCoupon) {
      throw new NotFoundException('优惠券不存在');
    }

    if (userCoupon.status !== 'AVAILABLE') {
      throw new BadRequestException('优惠券不可用');
    }

    const coupon = userCoupon.coupon;
    const now = new Date();

    if (now > coupon.validUntil) {
      throw new BadRequestException('优惠券已过期');
    }

    // 计算折扣金额
    let discount = 0;

    // 检查最低消费
    if (coupon.minAmount && orderAmount < Number(coupon.minAmount)) {
      throw new BadRequestException(
        `订单金额需满${coupon.minAmount}元才能使用此优惠券`,
      );
    }

    if (coupon.type === 'PERCENT') {
      discount = (orderAmount * Number(coupon.value)) / 100;

      // 检查最大优惠金额
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Number(coupon.value);
    }

    // 优惠金额不能超过订单金额
    if (discount > orderAmount) {
      discount = orderAmount;
    }

    return {
      discount,
      newTotal: orderAmount - discount,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        minAmount: coupon.minAmount,
        maxDiscount: coupon.maxDiscount,
      },
    };
  }

  /**
   * 使用优惠券
   */
  async useCoupon(userId: number, couponId: number, orderId: number) {
    const userCoupon = await this.prisma.userCoupon.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId,
        },
      },
      include: {
        coupon: true,
      },
    });

    if (!userCoupon) {
      throw new NotFoundException('优惠券不存在');
    }

    if (userCoupon.status !== 'AVAILABLE') {
      throw new BadRequestException('优惠券不可用');
    }

    const coupon = userCoupon.coupon;
    const now = new Date();

    if (now > coupon.validUntil) {
      throw new BadRequestException('优惠券已过期');
    }

    // 计算折扣金额
    let discount = 0;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const orderAmount = Number(order.totalAmount);

    // 检查最低消费
    if (coupon.minAmount && orderAmount < Number(coupon.minAmount)) {
      throw new BadRequestException(
        `订单金额需满${coupon.minAmount}元才能使用此优惠券`,
      );
    }

    if (coupon.type === 'PERCENT') {
      discount = (orderAmount * Number(coupon.value)) / 100;

      // 检查最大优惠金额
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Number(coupon.value);
    }

    // 优惠金额不能超过订单金额
    if (discount > orderAmount) {
      discount = orderAmount;
    }

    // 使用优惠券
    await this.prisma.$transaction(async (tx) => {
      // 更新用户优惠券状态
      await tx.userCoupon.update({
        where: { id: userCoupon.id },
        data: {
          status: 'USED',
          usedAt: now,
        },
      });

      // 创建订单优惠券关联
      await tx.orderCoupon.create({
        data: {
          orderId,
          couponId,
          discount,
        },
      });

      // 更新订单金额（这里只是记录，实际订单金额需要在订单创建时计算）
      // 注意：这需要与订单服务配合
    });

    return {
      discount,
      newTotal: orderAmount - discount,
    };
  }

  /**
   * 获取优惠券统计
   */
  async getCouponStats(couponId: number) {
    const coupon = await this.findOne(couponId);

    const [claimedCount, usedCount] = await Promise.all([
      this.prisma.userCoupon.count({
        where: { couponId },
      }),
      this.prisma.userCoupon.count({
        where: { couponId, status: 'USED' },
      }),
    ]);

    return {
      totalQuantity: coupon.totalQuantity,
      claimedQuantity: coupon.claimedQuantity,
      remainingQuantity: coupon.totalQuantity - coupon.claimedQuantity,
      claimedCount,
      usedCount,
      unusedCount: claimedCount - usedCount,
    };
  }
}
