import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundStatus } from '@prisma/client';

/**
 * 查询退款列表 DTO
 */
export class QueryRefundsDto {
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
    description: '退款状态',
    enum: RefundStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;
}
