import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto, QueryBannersDto } from './dto';
import { Roles } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  /**
   * 获取所有轮播图（管理员）
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取轮播图列表', description: '管理员获取轮播图列表，支持分页和筛选' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  findAll(@Query() query: QueryBannersDto) {
    return this.bannersService.findAll(query);
  }

  /**
   * 获取启用的轮播图（小程序/前端）
   */
  @Get('list')
  @ApiOperation({ summary: '获取启用的轮播图', description: '获取当前时间范围内启用的轮播图' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  findEnabled() {
    return this.bannersService.findEnabled();
  }

  /**
   * 获取轮播图详情
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取轮播图详情', description: '管理员获取轮播图详细信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '轮播图不存在',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.findOne(id);
  }

  /**
   * 创建轮播图
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建轮播图', description: '管理员创建新轮播图' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '创建成功',
  })
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto);
  }

  /**
   * 更新轮播图
   */
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '更新轮播图', description: '管理员更新轮播图信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '轮播图不存在',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannersService.update(id, updateBannerDto);
  }

  /**
   * 删除轮播图
   */
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除轮播图', description: '管理员删除轮播图' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '删除成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '轮播图不存在',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }

  /**
   * 切换启用状态
   */
  @Post(':id/toggle')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '切换启用状态', description: '管理员切换轮播图启用状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '操作成功',
  })
  toggleEnabled(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.toggleEnabled(id);
  }
}
