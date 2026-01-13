import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, IsDateString, IsOptional, Min, Max, IsArray, IsBoolean } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: '优惠券名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '优惠券描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '优惠券类型: PERCENT/AMOUNT' })
  @IsString()
  type: 'PERCENT' | 'AMOUNT';

  @ApiProperty({ description: '折扣值（百分比或金额）' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: '最低消费金额', required: false })
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiProperty({ description: '最大优惠金额', required: false })
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @ApiProperty({ description: '总发行数量' })
  @IsInt()
  @Min(1)
  totalQuantity: number;

  @ApiProperty({ description: '每人限领数量', required: false })
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  limitPerUser?: number;

  @ApiProperty({ description: '有效期开始时间' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: '有效期结束时间' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ description: '适用产品ID列表（空表示全部可用）', required: false })
  @ApiPropertyOptional()
  @IsArray()
  @IsNumber()
  @IsOptional()
  productIds?: number[];

  @ApiProperty({ description: '适用分类ID列表（空表示全部可用）', required: false })
  @ApiPropertyOptional()
  @IsArray()
  @IsNumber()
  @IsOptional()
  categoryIds?: number[];

  @ApiProperty({ description: '是否启用', required: false })
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class UpdateCouponDto {
  @ApiProperty({ description: '优惠券名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '优惠券描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '折扣值', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiProperty({ description: '最低消费金额', required: false })
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiProperty({ description: '最大优惠金额', required: false })
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @ApiProperty({ description: '是否启用', required: false })
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class QueryCouponsDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '状态筛选', required: false })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
}

export class ClaimCouponDto {
  @ApiProperty({ description: '优惠券ID' })
  @IsNumber()
  couponId: number;
}

export class UseCouponDto {
  @ApiProperty({ description: '优惠券ID' })
  @IsNumber()
  couponId: number;

  @ApiProperty({ description: '订单ID' })
  @IsNumber()
  orderId: number;
}
