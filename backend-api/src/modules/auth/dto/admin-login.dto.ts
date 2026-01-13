import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 管理员登录 DTO
 */
export class AdminLoginDto {
  @ApiProperty({
    description: '管理员邮箱',
    example: 'admin@bmad.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'Admin@123',
  })
  @IsString()
  @MinLength(1, { message: '密码不能为空' })
  password: string;
}
