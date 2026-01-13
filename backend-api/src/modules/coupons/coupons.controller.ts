import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, QueryCouponsDto, ClaimCouponDto, UseCouponDto } from './dto';
import { Roles, CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '@prisma/client';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: '获取优惠券列表' })
  findAll(@Query() query: QueryCouponsDto) {
    return this.couponsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的优惠券列表' })
  getMyCoupons(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    return this.couponsService.getUserCoupons(user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取优惠券详情' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(+id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取优惠券统计' })
  getCouponStats(@Param('id') id: string) {
    return this.couponsService.getCouponStats(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建优惠券' })
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '领取优惠券' })
  claimCoupon(@CurrentUser() user: AuthUser, @Body() claimCouponDto: ClaimCouponDto) {
    return this.couponsService.claimCoupon(user.id, claimCouponDto.couponId);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '验证优惠券并计算折扣' })
  validateCoupon(
    @CurrentUser() user: AuthUser,
    @Body() body: { couponId: number; orderAmount: number; productId: number },
  ) {
    return this.couponsService.validateCoupon(
      user.id,
      body.couponId,
      body.orderAmount,
      body.productId,
    );
  }

  @Post('use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '使用优惠券' })
  useCoupon(
    @CurrentUser() user: AuthUser,
    @Body() useCouponDto: UseCouponDto,
  ) {
    return this.couponsService.useCoupon(
      user.id,
      useCouponDto.couponId,
      useCouponDto.orderId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新优惠券' })
  update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponsService.update(+id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除优惠券' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(+id);
  }
}
