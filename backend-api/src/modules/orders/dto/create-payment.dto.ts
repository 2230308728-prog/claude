import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 创建支付 DTO
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: '订单ID',
    example: 1,
  })
  @IsString()
  orderId: string;
}
