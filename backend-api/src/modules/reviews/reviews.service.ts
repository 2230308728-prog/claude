import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto, QueryReviewsDto, AdminReplyDto, ApproveReviewDto } from './dto';
import { Prisma, ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 查询评价列表（分页）
   */
  async findAll(query: QueryReviewsDto) {
    const { page = 1, pageSize = 20, productId, userId, rating, status, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReviewWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (rating) {
      where.rating = rating;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { content: { contains: keyword, mode: 'insensitive' } },
        { adminReply: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNo: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
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
   * 获取评价详情
   */
  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNo: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    return review;
  }

  /**
   * 创建评价
   */
  async create(userId: number, createReviewDto: CreateReviewDto) {
    const { orderId, productId, rating, content, images, isAnonymous } = createReviewDto;

    // 验证订单是否存在且属于当前用户
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        productId,
        status: 'COMPLETED', // 只有已完成的订单才能评价
      },
    });

    if (!order) {
      throw new BadRequestException('订单不存在或未完成，无法评价');
    }

    // 检查是否已经评价过
    const existingReview = await this.prisma.review.findUnique({
      where: {
        orderId_productId: {
          orderId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('该订单已评价');
    }

    // 创建评价
    const review = await this.prisma.review.create({
      data: {
        orderId,
        productId,
        userId,
        rating,
        content,
        images: images || [],
        isAnonymous: isAnonymous || false,
        status: ReviewStatus.PENDING, // 默认待审核
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return review;
  }

  /**
   * 更新评价
   */
  async update(id: number, userId: number, updateReviewDto: UpdateReviewDto) {
    // 验证评价是否存在且属于当前用户
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('无权修改此评价');
    }

    // 只有待审核和已通过状态可以修改
    if (review.status === ReviewStatus.REJECTED) {
      throw new BadRequestException('已拒绝的评价不能修改');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        content: updateReviewDto.content,
        images: updateReviewDto.images,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * 删除评价
   */
  async remove(id: number, userId: number, isAdmin = false) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    // 只有评价作者或管理员可以删除
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('无权删除此评价');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  /**
   * 管理员回复评价
   */
  async adminReply(id: number, adminReplyDto: AdminReplyDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        adminReply: adminReplyDto.reply,
        repliedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * 审核评价
   */
  async approveReview(id: number, approveReviewDto: ApproveReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        status: approveReviewDto.status,
        adminReply: approveReviewDto.status === ReviewStatus.REJECTED
          ? `审核拒绝: ${approveReviewDto.reason || '未提供原因'}`
          : review.adminReply,
      },
    });

    return updated;
  }

  /**
   * 获取产品评价统计
   */
  async getProductStats(productId: number) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        status: ReviewStatus.APPROVED, // 只统计已通过的评价
      },
      select: {
        rating: true,
      },
    });

    const totalCount = reviews.length;
    const averageRating = totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

    // 各星级统计
    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((r) => {
      ratingCounts[r.rating as keyof typeof ratingCounts]++;
    });

    return {
      totalCount,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingCounts,
    };
  }

  /**
   * 获取用户评价列表
   */
  async getUserReviews(userId: number, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: { userId } }),
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
   * 获取待审核评价数量
   */
  async getPendingCount() {
    const count = await this.prisma.review.count({
      where: { status: ReviewStatus.PENDING },
    });

    return { count };
  }
}
