import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '@prisma/client';

/**
 * 更新用户状态 DTO
 */
export class UpdateUserStatusDto {
  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    example: 'ACTIVE',
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: '备注',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;
}
