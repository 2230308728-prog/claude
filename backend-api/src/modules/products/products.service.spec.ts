import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { OssService } from '../../common/oss/oss.service';
import { ProductsService } from './products.service';
import { ProductStatus } from '@prisma/client';
import { CreateProductDto, CreateCategoryDto, UpdateProductDto } from './dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;
  let cache: CacheService;
  let oss: OssService;

  // Mock data
  const mockCategory = {
    id: 1,
    name: 'Test Category',
    description: 'Test category description',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 1,
    title: 'Test Product',
    description: 'Test product description',
    categoryId: 1,
    price: 299.99,
    originalPrice: 399.99,
    stock: 100,
    minAge: 6,
    maxAge: 12,
    duration: 7,
    location: 'Beijing',
    images: ['https://example.com/image.jpg'],
    status: ProductStatus.DRAFT,
    featured: false,
    viewCount: 0,
    bookingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
  };

  const mockPrismaService = {
    productCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockOssService = {
    uploadFile: jest.fn(),
    validateImageFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: OssService,
          useValue: mockOssService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
    oss = module.get<OssService>(OssService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Product Categories', () => {
    describe('createCategory', () => {
      it('should create a new category', async () => {
        const dto: CreateCategoryDto = {
          name: 'New Category',
          description: 'New category description',
        };

        mockPrismaService.productCategory.create.mockResolvedValue(mockCategory);
        mockCacheService.del.mockResolvedValue(undefined);

        const result = await service.createCategory(dto);

        expect(result).toEqual(mockCategory);
        expect(prisma.productCategory.create).toHaveBeenCalledWith({
          data: {
            name: dto.name,
            description: dto.description,
            sortOrder: 0,
          },
        });
        expect(cache.del).toHaveBeenCalledWith('categories:list');
      });

      it('should create category with custom sort order', async () => {
        const dto: CreateCategoryDto = {
          name: 'New Category',
          description: 'New category description',
          sortOrder: 5,
        };

        mockPrismaService.productCategory.create.mockResolvedValue(mockCategory);
        mockCacheService.del.mockResolvedValue(undefined);

        await service.createCategory(dto);

        expect(prisma.productCategory.create).toHaveBeenCalledWith({
          data: {
            name: dto.name,
            description: dto.description,
            sortOrder: 5,
          },
        });
      });
    });

    describe('getCategories', () => {
      it('should return cached categories if available', async () => {
        const cachedCategories = [mockCategory];
        mockCacheService.get.mockResolvedValue(JSON.stringify(cachedCategories));

        const result = await service.getCategories();

        expect(result).toEqual(cachedCategories);
        expect(cache.get).toHaveBeenCalledWith('categories:list');
        expect(prisma.productCategory.findMany).not.toHaveBeenCalled();
      });

      it('should fetch and cache categories when not in cache', async () => {
        const categories = [mockCategory];
        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.productCategory.findMany.mockResolvedValue(categories);
        mockCacheService.set.mockResolvedValue(undefined);

        const result = await service.getCategories();

        expect(result).toEqual(categories);
        expect(prisma.productCategory.findMany).toHaveBeenCalledWith({
          orderBy: { sortOrder: 'asc' },
        });
        expect(cache.set).toHaveBeenCalledWith(
          'categories:list',
          JSON.stringify(categories),
          3600,
        );
      });
    });

    describe('getCategory', () => {
      it('should return a category with products', async () => {
        const categoryWithProducts = {
          ...mockCategory,
          products: [mockProduct],
        };

        mockPrismaService.productCategory.findUnique.mockResolvedValue(
          categoryWithProducts,
        );

        const result = await service.getCategory(1);

        expect(result).toEqual(categoryWithProducts);
        expect(prisma.productCategory.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: {
            products: {
              where: { status: ProductStatus.PUBLISHED },
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      });

      it('should throw NotFoundException when category does not exist', async () => {
        mockPrismaService.productCategory.findUnique.mockResolvedValue(null);

        await expect(service.getCategory(999)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.getCategory(999)).rejects.toThrow(
          '产品分类不存在',
        );
      });
    });

    describe('updateCategory', () => {
      it('should update an existing category', async () => {
        const updatedCategory = { ...mockCategory, name: 'Updated Category' };
        const updateDto = { name: 'Updated Category' };

        mockPrismaService.productCategory.findUnique.mockResolvedValue(
          mockCategory,
        );
        mockPrismaService.productCategory.update.mockResolvedValue(
          updatedCategory,
        );
        mockCacheService.del.mockResolvedValue(undefined);

        const result = await service.updateCategory(1, updateDto);

        expect(result).toEqual(updatedCategory);
        expect(prisma.productCategory.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: updateDto,
        });
        expect(cache.del).toHaveBeenCalledWith('categories:list');
      });

      it('should throw NotFoundException when updating non-existent category', async () => {
        mockPrismaService.productCategory.findUnique.mockResolvedValue(null);

        await expect(
          service.updateCategory(999, { name: 'New Name' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteCategory', () => {
      it('should delete a category with no products', async () => {
        mockPrismaService.product.count.mockResolvedValue(0);
        mockPrismaService.productCategory.findUnique.mockResolvedValue(
          mockCategory,
        );
        mockPrismaService.productCategory.delete.mockResolvedValue(mockCategory);
        mockCacheService.del.mockResolvedValue(undefined);

        await service.deleteCategory(1);

        expect(prisma.productCategory.delete).toHaveBeenCalledWith({
          where: { id: 1 },
        });
        expect(cache.del).toHaveBeenCalledWith('categories:list');
      });

      it('should throw BadRequestException when category has products', async () => {
        mockPrismaService.product.count.mockResolvedValue(5);

        await expect(service.deleteCategory(1)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.deleteCategory(1)).rejects.toThrow(
          '该分类下还有产品，无法删除',
        );
      });
    });
  });

  describe('Products', () => {
    describe('createProduct', () => {
      it('should create a new product', async () => {
        const dto: CreateProductDto = {
          title: 'New Product',
          description: 'New product description',
          categoryId: 1,
          price: 299.99,
          stock: 100,
        };

        mockPrismaService.productCategory.findUnique.mockResolvedValue(
          mockCategory,
        );
        mockPrismaService.product.create.mockResolvedValue(mockProduct);

        const result = await service.createProduct(dto, 1);

        expect(result).toEqual(mockProduct);
        expect(prisma.productCategory.findUnique).toHaveBeenCalledWith({
          where: { id: dto.categoryId },
        });
        expect(prisma.product.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: dto.title,
            categoryId: dto.categoryId,
            status: ProductStatus.DRAFT,
          }),
        });
      });

      it('should throw NotFoundException when category does not exist', async () => {
        const dto: CreateProductDto = {
          title: 'New Product',
          description: 'New product description',
          categoryId: 999,
          price: 299.99,
          stock: 100,
        };

        mockPrismaService.productCategory.findUnique.mockResolvedValue(null);

        await expect(service.createProduct(dto, 1)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.createProduct(dto, 1)).rejects.toThrow(
          '产品分类不存在',
        );
      });
    });

    describe('getProduct', () => {
      it('should return a product and increment view count', async () => {
        mockPrismaService.product.findUnique
          .mockResolvedValueOnce(mockProduct)
          .mockResolvedValueOnce(mockProduct);

        const result = await service.getProduct(1);

        expect(result).toEqual(mockProduct);
        expect(prisma.product.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: { category: true },
        });
        expect(prisma.product.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { viewCount: { increment: 1 } },
        });
      });

      it('should throw NotFoundException when product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.getProduct(999)).rejects.toThrow(NotFoundException);
        await expect(service.getProduct(999)).rejects.toThrow('产品不存在');
      });
    });

    describe('publishProduct', () => {
      it('should publish a draft product', async () => {
        const publishedProduct = {
          ...mockProduct,
          status: ProductStatus.PUBLISHED,
        };

        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.product.update.mockResolvedValue(publishedProduct);

        const result = await service.publishProduct(1, 1);

        expect(result).toEqual(publishedProduct);
        expect(prisma.product.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { status: ProductStatus.PUBLISHED },
        });
      });

      it('should throw BadRequestException when product already published', async () => {
        const publishedProduct = {
          ...mockProduct,
          status: ProductStatus.PUBLISHED,
        };

        mockPrismaService.product.findUnique.mockResolvedValue(publishedProduct);

        await expect(service.publishProduct(1, 1)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.publishProduct(1, 1)).rejects.toThrow(
          '产品已经是发布状态',
        );
      });

      it('should throw NotFoundException when product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.publishProduct(999, 1)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('unpublishProduct', () => {
      it('should unpublish a published product', async () => {
        const unpublishedProduct = {
          ...mockProduct,
          status: ProductStatus.UNPUBLISHED,
        };

        mockPrismaService.product.findUnique.mockResolvedValue(
          unpublishedProduct,
        );
        mockPrismaService.product.update.mockResolvedValue(unpublishedProduct);

        const result = await service.unpublishProduct(1, 1);

        expect(result.status).toBe(ProductStatus.UNPUBLISHED);
        expect(prisma.product.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { status: ProductStatus.UNPUBLISHED },
        });
      });

      it('should throw BadRequestException when product is not published', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

        await expect(service.unpublishProduct(1, 1)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.unpublishProduct(1, 1)).rejects.toThrow(
          '产品未处于发布状态',
        );
      });
    });

    describe('searchProducts', () => {
      it('should search products by keyword', async () => {
        const products = [mockProduct];
        mockPrismaService.product.findMany.mockResolvedValue(products);

        const result = await service.searchProducts('test', 10);

        expect(result).toEqual(products);
        expect(prisma.product.findMany).toHaveBeenCalledWith({
          where: {
            status: ProductStatus.PUBLISHED,
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'test',
                  mode: 'insensitive',
                }),
              }),
            ]),
          },
          take: 10,
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
      });
    });

    describe('getFeaturedProducts', () => {
      it('should return cached featured products', async () => {
        const products = [mockProduct];
        mockCacheService.get.mockResolvedValue(JSON.stringify(products));

        const result = await service.getFeaturedProducts(10);

        expect(result).toEqual(products);
        expect(cache.get).toHaveBeenCalledWith('products:featured:10');
        expect(prisma.product.findMany).not.toHaveBeenCalled();
      });

      it('should fetch and cache featured products', async () => {
        const products = [mockProduct];
        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.product.findMany.mockResolvedValue(products);
        mockCacheService.set.mockResolvedValue(undefined);

        const result = await service.getFeaturedProducts(10);

        expect(result).toEqual(products);
        expect(cache.set).toHaveBeenCalledWith(
          'products:featured:10',
          JSON.stringify(products),
          600,
        );
      });
    });

    describe('deleteProduct', () => {
      it('should delete a product with no orders', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.order.count.mockResolvedValue(0);
        mockPrismaService.product.delete.mockResolvedValue(mockProduct);

        await service.deleteProduct(1, 1);

        expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      });

      it('should throw BadRequestException when product has orders', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.order.count.mockResolvedValue(5);

        await expect(service.deleteProduct(1, 1)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.deleteProduct(1, 1)).rejects.toThrow(
          '该产品已有订单，无法删除',
        );
      });

      it('should throw NotFoundException when product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.deleteProduct(999, 1)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('uploadProductImage', () => {
      it('should upload a valid image', async () => {
        const fileBuffer = Buffer.from('test image data');
        const fileName = 'test-image.jpg';
        const uploadedUrl = 'https://example.com/products/test-image.jpg';

        mockOssService.validateImageFile.mockReturnValue(true);
        mockOssService.uploadFile.mockResolvedValue(uploadedUrl);

        const result = await service.uploadProductImage(
          fileBuffer,
          fileName,
          1,
        );

        expect(result).toEqual({ url: uploadedUrl });
        expect(oss.validateImageFile).toHaveBeenCalledWith(fileName);
        expect(oss.uploadFile).toHaveBeenCalledWith(
          fileBuffer,
          fileName,
          'products',
        );
      });

      it('should throw BadRequestException for invalid image format', async () => {
        const fileBuffer = Buffer.from('test data');
        const fileName = 'test-file.txt';

        mockOssService.validateImageFile.mockReturnValue(false);

        await expect(
          service.uploadProductImage(fileBuffer, fileName, 1),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.uploadProductImage(fileBuffer, fileName, 1),
        ).rejects.toThrow('不支持的图片格式');
      });
    });
  });
});
