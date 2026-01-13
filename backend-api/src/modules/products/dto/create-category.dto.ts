import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

/**
 * 创建产品分类 DTO
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '户外探险',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '分类描述',
    example: '户外探险类研学活动',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '排序顺序',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
