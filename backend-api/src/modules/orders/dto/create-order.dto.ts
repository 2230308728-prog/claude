import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  Min,
  IsArray,
  MaxLength,
} from 'class-validator';

/**
 * 创建订单 DTO
 */
export class CreateOrderDto {
  @ApiProperty({
    description: '产品ID',
    example: 1,
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    description: '儿童姓名',
    example: '张小明',
  })
  @IsString()
  @MaxLength(50)
  childName: string;

  @ApiProperty({
    description: '儿童年龄',
    example: 8,
  })
  @IsInt()
  @Min(1)
  childAge: number;

  @ApiProperty({
    description: '联系电话',
    example: '13800138000',
  })
  @IsString()
  @MaxLength(20)
  contactPhone: string;

  @ApiProperty({
    description: '联系人姓名',
    example: '张先生',
  })
  @IsString()
  @MaxLength(50)
  contactName: string;

  @ApiProperty({
    description: '预订日期',
    example: '2024-02-15',
  })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({
    description: '参与人数',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  participantCount?: number;

  @ApiProperty({
    description: '备注',
    example: '孩子对花生过敏',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;
}
