import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, SystemSettings } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

/**
 * 更新设置DTO
 */
export class UpdateSettingsDto {
  siteName?: string;
  siteDescription?: string;
  siteUrl?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiKey?: string;
  wechatApiV3Key?: string;
  wechatCertPath?: string;
  paymentEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  orderNotificationEmail?: string;
  lowStockAlertEnabled?: boolean;
  lowStockThreshold?: number;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  passwordMinLength?: number;
  requireEmailVerification?: boolean;
}

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * 获取所有设置（管理员）
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有系统设置（管理员）' })
  async getAllSettings(): Promise<SystemSettings> {
    return this.settingsService.getSettings();
  }

  /**
   * 获取特定类别的设置（管理员）
   */
  @Get(':category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取特定类别的系统设置（管理员）' })
  async getSettingsByCategory(@Body('category') category: 'general' | 'payment' | 'notification' | 'security') {
    return this.settingsService.getSettingsByCategory(category);
  }

  /**
   * 更新设置（管理员）
   */
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新系统设置（管理员）' })
  async updateSettings(@Body() dto: UpdateSettingsDto): Promise<SystemSettings> {
    return this.settingsService.updateSettings(dto);
  }
}
