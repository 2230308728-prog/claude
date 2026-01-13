import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto, QueryBannersDto } from './dto';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建轮播图
   */
  async create(createBannerDto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: createBannerDto.title,
        imageUrl: createBannerDto.imageUrl,
        linkUrl: createBannerDto.linkUrl,
        linkType: createBannerDto.linkType,
        productId: createBannerDto.productId,
        categoryId: createBannerDto.categoryId,
        sortOrder: createBannerDto.sortOrder ?? 0,
        isEnabled: createBannerDto.isEnabled ?? true,
        startDate: createBannerDto.startDate ? new Date(createBannerDto.startDate) : null,
        endDate: createBannerDto.endDate ? new Date(createBannerDto.endDate) : null,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 获取轮播图列表
   */
  async findAll(query: QueryBannersDto) {
    const { page = 1, pageSize = 20, isEnabled, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    if (keyword) {
      where.title = {
        contains: keyword,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.banner.count({ where }),
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
   * 获取启用的轮播图列表（供小程序使用）
   */
  async findEnabled() {
    const now = new Date();

    return this.prisma.banner.findMany({
      where: {
        isEnabled: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 获取轮播图详情
   */
  async findOne(id: number) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    return banner;
  }

  /**
   * 更新轮播图
   */
  async update(id: number, updateBannerDto: UpdateBannerDto) {
    // 检查轮播图是否存在
    await this.findOne(id);

    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(updateBannerDto.title !== undefined && { title: updateBannerDto.title }),
        ...(updateBannerDto.imageUrl !== undefined && { imageUrl: updateBannerDto.imageUrl }),
        ...(updateBannerDto.linkUrl !== undefined && { linkUrl: updateBannerDto.linkUrl }),
        ...(updateBannerDto.linkType !== undefined && { linkType: updateBannerDto.linkType }),
        ...(updateBannerDto.productId !== undefined && { productId: updateBannerDto.productId }),
        ...(updateBannerDto.categoryId !== undefined && { categoryId: updateBannerDto.categoryId }),
        ...(updateBannerDto.sortOrder !== undefined && { sortOrder: updateBannerDto.sortOrder }),
        ...(updateBannerDto.isEnabled !== undefined && { isEnabled: updateBannerDto.isEnabled }),
        ...(updateBannerDto.startDate !== undefined && { startDate: new Date(updateBannerDto.startDate) }),
        ...(updateBannerDto.endDate !== undefined && { endDate: new Date(updateBannerDto.endDate) }),
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 删除轮播图
   */
  async remove(id: number) {
    // 检查轮播图是否存在
    await this.findOne(id);

    return this.prisma.banner.delete({
      where: { id },
    });
  }

  /**
   * 切换启用状态
   */
  async toggleEnabled(id: number) {
    const banner = await this.findOne(id);

    return this.prisma.banner.update({
      where: { id },
      data: {
        isEnabled: !banner.isEnabled,
      },
    });
  }
}
