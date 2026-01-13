import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

/**
 * 查询产品列表 DTO
 */
export class QueryProductsDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({
    description: '分类ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiProperty({
    description: '搜索关键词',
    example: '探险',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '产品状态',
    enum: ProductStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({
    description: '是否只看推荐',
    example: true,
    required: false,
  })
  @IsOptional()
  featured?: boolean;

  @ApiProperty({
    description: '最小年龄',
    example: 6,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minAge?: number;

  @ApiProperty({
    description: '最大年龄',
    example: 12,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxAge?: number;

  @ApiProperty({
    description: '排序字段',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: '排序方向',
    example: 'desc',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
