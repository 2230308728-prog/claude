import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { RefundStatus } from '@prisma/client';

/**
 * 审核退款 DTO
 */
export class ProcessRefundDto {
  @ApiProperty({
    description: '审核状态',
    enum: RefundStatus,
    example: 'APPROVED',
  })
  status: RefundStatus;

  @ApiProperty({
    description: '管理员备注',
    example: '同意退款申请',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  adminNote?: string;

  @ApiProperty({
    description: '拒绝原因（仅拒绝时必填）',
    example: '退款期限已过',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejectedReason?: string;
}
