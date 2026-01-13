import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { OssService } from '../../common/oss/oss.service';
import { ProductStatus } from '@prisma/client';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
} from './dto';

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
 * ProductsService - 产品服务
 *
 * 处理产品和产品分类的 CRUD 操作
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly oss: OssService,
  ) {}

  // ============================================
  // 产品分类管理
  // ============================================

  /**
   * 创建产品分类
   */
  async createCategory(dto: CreateCategoryDto) {
    const category = await this.prisma.productCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    // 清除分类列表缓存
    await this.clearCategoryCache();

    this.logger.log(`Category created: ${category.id}`);
    return category;
  }

  /**
   * 获取所有产品分类
   */
  async getCategories() {
    // 尝试从缓存获取
    const cacheKey = 'categories:list';
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // 缓存结果（1小时）
    await this.cache.set(cacheKey, JSON.stringify(categories), 3600);

    return categories;
  }

  /**
   * 获取单个产品分类
   */
  async getCategory(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: ProductStatus.PUBLISHED },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('产品分类不存在');
    }

    return category;
  }

  /**
   * 更新产品分类
   */
  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('产品分类不存在');
    }

    const updated = await this.prisma.productCategory.update({
      where: { id },
      data: dto,
    });

    // 清除分类列表缓存
    await this.clearCategoryCache();

    this.logger.log(`Category updated: ${id}`);
    return updated;
  }

  /**
   * 删除产品分类
   */
  async deleteCategory(id: number) {
    // 检查是否有产品使用该分类
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException('该分类下还有产品，无法删除');
    }

    await this.prisma.productCategory.delete({
      where: { id },
    });

    // 清除分类列表缓存
    await this.clearCategoryCache();

    this.logger.log(`Category deleted: ${id}`);
  }

  // ============================================
  // 产品管理
  // ============================================

  /**
   * 创建产品
   */
  async createProduct(dto: CreateProductDto, userId: number) {
    // 验证分类是否存在
    const category = await this.prisma.productCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('产品分类不存在');
    }

    const product = await this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        price: dto.price,
        originalPrice: dto.originalPrice,
        stock: dto.stock,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
        duration: dto.duration,
        location: dto.location,
        images: dto.images,
        status: ProductStatus.DRAFT,
        featured: dto.featured ?? false,
      },
    });

    this.logger.log(`Product created: ${product.id} by user ${userId}`);
    return product;
  }

  /**
   * 获取产品列表
   */
  async getProducts(query: QueryProductsDto): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 10,
      categoryId,
      keyword,
      status,
      featured,
      minAge,
      maxAge,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // 构建查询条件
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (featured) {
      where.featured = true;
    }

    if (minAge !== undefined) {
      where.maxAge = { gte: minAge };
    }

    if (maxAge !== undefined) {
      where.minAge = { lte: maxAge };
    }

    // 查询总数
    const total = await this.prisma.product.count({ where });

    // 查询数据
    const products = await this.prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      data: products,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取产品详情
   */
  async getProduct(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 增加浏览次数
    await this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return product;
  }

  /**
   * 更新产品
   */
  async updateProduct(id: number, dto: UpdateProductDto, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Product updated: ${id} by user ${userId}`);
    return updated;
  }

  /**
   * 删除产品
   */
  async deleteProduct(id: number, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 检查是否有相关订单
    const orderCount = await this.prisma.order.count({
      where: { productId: id },
    });

    if (orderCount > 0) {
      throw new BadRequestException('该产品已有订单，无法删除');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    this.logger.log(`Product deleted: ${id} by user ${userId}`);
  }

  /**
   * 发布产品
   */
  async publishProduct(id: number, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    if (product.status === ProductStatus.PUBLISHED) {
      throw new BadRequestException('产品已经是发布状态');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.PUBLISHED },
    });

    this.logger.log(`Product published: ${id} by user ${userId}`);
    return updated;
  }

  /**
   * 下架产品
   */
  async unpublishProduct(id: number, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('产品未处于发布状态');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.UNPUBLISHED },
    });

    this.logger.log(`Product unpublished: ${id} by user ${userId}`);
    return updated;
  }

  /**
   * 上传产品图片
   */
  async uploadProductImage(
    file: Buffer,
    fileName: string,
    userId: number,
  ): Promise<{ url: string }> {
    // 验证图片类型
    if (!this.oss.validateImageFile(fileName)) {
      throw new BadRequestException('不支持的图片格式，仅支持 jpg、jpeg、png、webp、gif');
    }

    // 上传到 OSS
    const url = await this.oss.uploadFile(file, fileName, 'products');

    this.logger.log(`Product image uploaded: ${url} by user ${userId}`);
    return { url };
  }

  /**
   * 获取推荐产品
   */
  async getFeaturedProducts(limit: number = 10) {
    // 尝试从缓存获取
    const cacheKey = `products:featured:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        featured: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 缓存结果（10分钟）
    await this.cache.set(cacheKey, JSON.stringify(products), 600);

    return products;
  }

  /**
   * 搜索产品
   */
  async searchProducts(keyword: string, limit: number = 20) {
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { bookingCount: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return products;
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 清除分类缓存
   */
  private async clearCategoryCache(): Promise<void> {
    await this.cache.del('categories:list');
  }
}
