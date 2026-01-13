import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

/**
 * 微信用户信息
 */
export class WechatUserInfo {
  @ApiProperty({
    description: '用户昵称',
    example: '微信用户',
  })
  nickName: string;

  @ApiProperty({
    description: '用户头像URL',
    example: 'https://thirdwx.qlogo.cn/...',
    required: false,
  })
  avatarUrl?: string;
}

/**
 * 微信授权登录 DTO
 */
export class WechatLoginDto {
  @ApiProperty({
    description: '微信登录凭证 (wx.login 返回的 code)',
    example: '071A2c3w2yLFBY0Y1w2w3J2w3w0A2c3v',
  })
  @IsString()
  @IsNotEmpty({ message: '微信登录凭证不能为空' })
  code: string;

  @ApiProperty({
    description: '用户信息（通过 wx.getUserProfile 获取）',
    type: WechatUserInfo,
    required: false,
  })
  @IsObject()
  @IsOptional()
  userInfo?: WechatUserInfo;
}
