import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { Roles } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
} from './dto';

/**
 * ProductsController - 产品控制器
 *
 * 处理产品和产品分类的 HTTP 请求
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================
  // 产品分类管理
  // ============================================

  /**
   * 创建产品分类
   */
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '创建产品分类', description: '管理员创建新的产品分类' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '分类创建成功',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '权限不足',
  })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  /**
   * 获取所有产品分类
   */
  @Get('categories')
  @ApiOperation({ summary: '获取产品分类列表', description: '获取所有产品分类' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getCategories() {
    return this.productsService.getCategories();
  }

  /**
   * 获取单个产品分类
   */
  @Get('categories/:id')
  @ApiOperation({ summary: '获取产品分类详情', description: '获取指定产品分类的详情' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '分类不存在',
  })
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getCategory(id);
  }

  /**
   * 更新产品分类
   */
  @Put('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '更新产品分类', description: '管理员更新产品分类信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '权限不足',
  })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(id, dto);
  }

  /**
   * 删除产品分类
   */
  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '删除产品分类', description: '管理员删除产品分类' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '删除成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '该分类下还有产品，无法删除',
  })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.deleteCategory(id);
  }

  // ============================================
  // 产品管理
  // ============================================

  /**
   * 创建产品
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '创建产品', description: '管理员创建新产品' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '产品创建成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  async createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.createProduct(dto, user.id);
  }

  /**
   * 获取产品列表
   */
  @Get()
  @ApiOperation({ summary: '获取产品列表', description: '根据查询条件获取产品列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getProducts(@Query() query: QueryProductsDto) {
    return this.productsService.getProducts(query);
  }

  /**
   * 获取产品详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取产品详情', description: '获取指定产品的详细信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '产品不存在',
  })
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProduct(id);
  }

  /**
   * 更新产品
   */
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '更新产品', description: '管理员更新产品信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '产品不存在',
  })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateProduct(id, dto, user.id);
  }

  /**
   * 删除产品
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '删除产品', description: '管理员删除产品' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '删除成功',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '该产品已有订单，无法删除',
  })
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.productsService.deleteProduct(id, user.id);
  }

  /**
   * 发布产品
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '发布产品', description: '管理员发布产品' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发布成功',
  })
  async publishProduct(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.publishProduct(id, user.id);
  }

  /**
   * 下架产品
   */
  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '下架产品', description: '管理员下架产品' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '下架成功',
  })
  async unpublishProduct(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.unpublishProduct(id, user.id);
  }

  /**
   * 上传产品图片
   */
  @Post('images/upload')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传产品图片', description: '管理员上传产品图片到 OSS' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '上传成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            url: { type: 'string', example: 'https://cdn.example.com/products/2024/01/12/xxx.jpg' },
          },
        },
      },
    },
  })
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.uploadProductImage(
      file.buffer,
      file.originalname,
      user.id,
    );
  }

  /**
   * 获取推荐产品
   */
  @Get('featured/list')
  @ApiOperation({ summary: '获取推荐产品', description: '获取推荐产品列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  async getFeaturedProducts(@Query('limit', ParseIntPipe) limit?: number) {
    return this.productsService.getFeaturedProducts(limit);
  }

  /**
   * 搜索产品
   */
  @Get('search/results')
  @ApiOperation({ summary: '搜索产品', description: '根据关键词搜索产品' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '搜索成功',
  })
  async searchProducts(
    @Query('keyword') keyword: string,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.productsService.searchProducts(keyword, limit);
  }
}
