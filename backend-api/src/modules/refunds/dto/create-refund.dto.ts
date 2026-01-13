import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';

/**
 * 创建退款申请 DTO
 */
export class CreateRefundDto {
  @ApiProperty({
    description: '订单ID',
    example: 1,
  })
  @IsInt()
  orderId: number;

  @ApiProperty({
    description: '退款金额（元）',
    example: '299.00',
  })
  @IsString()
  refundAmount: string;

  @ApiProperty({
    description: '退款原因',
    example: '行程有变，无法参加',
  })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiProperty({
    description: '详细说明',
    example: '孩子突然生病，需要请假去医院',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: '凭证图片URL列表',
    example: ['https://example.com/image1.jpg'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
