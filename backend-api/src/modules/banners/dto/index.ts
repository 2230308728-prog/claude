import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  IsIn,
  Min,
} from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ description: '轮播图标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '图片URL' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: '链接URL' })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiProperty({
    description: '链接类型',
    enum: ['none', 'product', 'category', 'url', 'mini_program'],
    default: 'none'
  })
  @IsIn(['none', 'product', 'category', 'url', 'mini_program'])
  linkType: 'none' | 'product' | 'category' | 'url' | 'mini_program';

  @ApiPropertyOptional({ description: '关联产品ID' })
  @IsInt()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ description: '关联分类ID' })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: '排序（数字越小越靠前）', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '开始展示时间' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束展示时间' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateBannerDto {
  @ApiPropertyOptional({ description: '轮播图标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '图片URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '链接URL' })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiPropertyOptional({
    description: '链接类型',
    enum: ['none', 'product', 'category', 'url', 'mini_program']
  })
  @IsIn(['none', 'product', 'category', 'url', 'mini_program'])
  @IsOptional()
  linkType?: 'none' | 'product' | 'category' | 'url' | 'mini_program';

  @ApiPropertyOptional({ description: '关联产品ID' })
  @IsInt()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ description: '关联分类ID' })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: '排序（数字越小越靠前）' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '开始展示时间' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束展示时间' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class QueryBannersDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
