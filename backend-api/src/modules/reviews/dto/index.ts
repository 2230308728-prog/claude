import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, IsOptional, IsBoolean, IsArray, Min, Max, IsEnum } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: '订单ID' })
  @IsNumber()
  @IsInt()
  orderId: number;

  @ApiProperty({ description: '产品ID' })
  @IsNumber()
  @IsInt()
  productId: number;

  @ApiProperty({ description: '评分 1-5星', minimum: 1, maximum: 5 })
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '评价内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '评价图片URL数组', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: '是否匿名', required: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class UpdateReviewDto {
  @ApiProperty({ description: '评价内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '评价图片URL数组', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class QueryReviewsDto {
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

  @ApiProperty({ description: '产品ID', required: false })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({ description: '评分筛选', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: '状态筛选', required: false })
  @IsOptional()
  @IsString()
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class AdminReplyDto {
  @ApiProperty({ description: '管理员回复内容' })
  @IsString()
  reply: string;
}

export class ApproveReviewDto {
  @ApiProperty({ description: '审核状态', enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiProperty({ description: '拒绝原因（仅拒绝时需要）', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
