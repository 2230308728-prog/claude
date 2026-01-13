import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, QueryReviewsDto, AdminReplyDto, ApproveReviewDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '@prisma/client';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '获取评价列表' })
  findAll(@Query() query: QueryReviewsDto) {
    return this.reviewsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的评价列表' })
  getMyReviews(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.reviewsService.getUserReviews(user.id, page, pageSize);
  }

  @Get('pending/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取待审核评价数量' })
  getPendingCount() {
    return this.reviewsService.getPendingCount();
  }

  @Get('product/:productId/stats')
  @ApiOperation({ summary: '获取产品评价统计' })
  getProductStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductStats(+productId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取评价详情' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建评价' })
  create(@CurrentUser() user: AuthUser, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新评价' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(+id, user.id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评价' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reviewsService.remove(+id, user.id, false);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员回复评价' })
  adminReply(
    @Param('id') id: string,
    @Body() adminReplyDto: AdminReplyDto,
  ) {
    return this.reviewsService.adminReply(+id, adminReplyDto);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核评价' })
  approveReview(
    @Param('id') id: string,
    @Body() approveReviewDto: ApproveReviewDto,
  ) {
    return this.reviewsService.approveReview(+id, approveReviewDto);
  }

  @Delete(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员删除评价' })
  adminRemove(@Param('id') id: string) {
    return this.reviewsService.remove(+id, 0, true);
  }
}
