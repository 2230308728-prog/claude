import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ description: '用户ID' })
  userId: number;

  @ApiProperty({ description: '通知类型' })
  type: 'ORDER_CONFIRM' | 'REMINDER' | 'REFUND' | 'ORDER_STATUS';

  @ApiProperty({ description: '通知数据' })
  data: Record<string, any>;
}

export class SubscribeMessageDto {
  @ApiProperty({ description: '用户OpenID' })
  openid: string;

  @ApiProperty({ description: '模板ID' })
  templateId: string;

  @ApiProperty({ description: '跳转小程序页面' })
  page?: string;

  @ApiProperty({ description: '模板数据' })
  data: Record<string, any>;
}
