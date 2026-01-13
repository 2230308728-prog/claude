import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

/**
 * 管理员注册 DTO
 */
export class AdminRegisterDto {
  @ApiProperty({
    description: '管理员邮箱',
    example: 'admin@bmad.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '密码（至少8位，包含字母和数字）',
    example: 'Admin@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '密码长度至少为8位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password: string;

  @ApiProperty({
    description: '管理员昵称',
    example: '超级管理员',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;
}
