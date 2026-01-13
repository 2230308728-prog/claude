import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 系统设置接口
 */
export interface SystemSettings {
  // 通用设置
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;

  // 支付设置
  wechatAppId: string;
  wechatMchId: string;
  wechatApiKey: string;
  wechatApiV3Key: string;
  wechatCertPath: string;
  paymentEnabled: boolean;

  // 通知设置
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  orderNotificationEmail: string;
  lowStockAlertEnabled: boolean;
  lowStockThreshold: number;

  // 安全设置
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
}

/**
 * SettingsService - 系统设置服务
 *
 * 管理系统配置，包括通用设置、支付设置、通知设置和安全设置
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  // 默认设置
  private readonly defaultSettings: SystemSettings = {
    // 通用设置
    siteName: 'bmad研学商城',
    siteDescription: '专业的研学旅行产品预订平台',
    siteUrl: 'https://example.com',
    logoUrl: '',
    contactEmail: 'contact@example.com',
    contactPhone: '400-123-4567',

    // 支付设置
    wechatAppId: '',
    wechatMchId: '',
    wechatApiKey: '',
    wechatApiV3Key: '',
    wechatCertPath: '',
    paymentEnabled: true,

    // 通知设置
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    orderNotificationEmail: 'admin@example.com',
    lowStockAlertEnabled: true,
    lowStockThreshold: 10,

    // 安全设置
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireEmailVerification: true,
  };

  constructor(private configService: ConfigService) {}

  /**
   * 获取所有设置
   */
  async getSettings(): Promise<SystemSettings> {
    // 从环境变量或数据库读取设置
    // 这里先返回默认设置，实际应该从数据库或配置文件读取
    return {
      ...this.defaultSettings,
      // 从环境变量覆盖
      siteName: this.configService.get<string>('SITE_NAME') || this.defaultSettings.siteName,
      siteUrl: this.configService.get<string>('SITE_URL') || this.defaultSettings.siteUrl,
      contactEmail: this.configService.get<string>('CONTACT_EMAIL') || this.defaultSettings.contactEmail,
      contactPhone: this.configService.get<string>('CONTACT_PHONE') || this.defaultSettings.contactPhone,
      wechatAppId: this.configService.get<string>('WECHAT_APP_ID') || this.defaultSettings.wechatAppId,
      wechatMchId: this.configService.get<string>('WECHAT_PAY_MCHID') || this.defaultSettings.wechatMchId,
      paymentEnabled: this.configService.get<string>('PAYMENT_ENABLED') !== 'false',
    };
  }

  /**
   * 更新设置
   */
  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    this.logger.log(`Updating settings: ${JSON.stringify(Object.keys(settings))}`);

    // 实际应该保存到数据库
    // 这里更新环境变量或配置文件
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    // 记录设置变更
    for (const [key, value] of Object.entries(settings)) {
      this.logger.log(`Setting updated: ${key} = ${JSON.stringify(value)}`);
    }

    return updatedSettings;
  }

  /**
   * 获取特定类别的设置
   */
  async getSettingsByCategory(category: 'general' | 'payment' | 'notification' | 'security') {
    const settings = await this.getSettings();

    switch (category) {
      case 'general':
        return {
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          siteUrl: settings.siteUrl,
          logoUrl: settings.logoUrl,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
        };

      case 'payment':
        return {
          wechatAppId: settings.wechatAppId,
          wechatMchId: settings.wechatMchId,
          wechatApiKey: settings.wechatApiKey,
          wechatApiV3Key: settings.wechatApiV3Key,
          wechatCertPath: settings.wechatCertPath,
          paymentEnabled: settings.paymentEnabled,
        };

      case 'notification':
        return {
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          smsNotificationsEnabled: settings.smsNotificationsEnabled,
          orderNotificationEmail: settings.orderNotificationEmail,
          lowStockAlertEnabled: settings.lowStockAlertEnabled,
          lowStockThreshold: settings.lowStockThreshold,
        };

      case 'security':
        return {
          sessionTimeout: settings.sessionTimeout,
          maxLoginAttempts: settings.maxLoginAttempts,
          passwordMinLength: settings.passwordMinLength,
          requireEmailVerification: settings.requireEmailVerification,
        };

      default:
        throw new Error(`Unknown settings category: ${category}`);
    }
  }
}
