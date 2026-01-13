import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsDecimal,
  IsArray,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

/**
 * 创建产品 DTO
 */
export class CreateProductDto {
  @ApiProperty({
    description: '产品标题',
    example: '小小探险家：城市户外生存体验',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '产品描述',
    example: '在专业教练带领下，学习户外生存技能...',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: '分类ID',
    example: 1,
  })
  @IsInt()
  categoryId: number;

  @ApiProperty({
    description: '产品价格（元）',
    example: 299.00,
  })
  @IsDecimal()
  price: string;

  @ApiProperty({
    description: '原价（用于显示折扣）',
    example: 399.00,
    required: false,
  })
  @IsDecimal()
  @IsOptional()
  originalPrice?: string;

  @ApiProperty({
    description: '库存数量',
    example: 50,
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: '最小年龄',
    example: 6,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  minAge?: number;

  @ApiProperty({
    description: '最大年龄',
    example: 12,
    required: false,
  })
  @IsInt()
  @Max(18)
  @IsOptional()
  maxAge?: number;

  @ApiProperty({
    description: '活动时长',
    example: '3小时',
  })
  @IsString()
  duration: string;

  @ApiProperty({
    description: '活动地点',
    example: '奥林匹克森林公园',
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: '产品图片URL列表',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: '是否推荐',
    example: true,
    required: false,
  })
  @IsOptional()
  featured?: boolean;
}
