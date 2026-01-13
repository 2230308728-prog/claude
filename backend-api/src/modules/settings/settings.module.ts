import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * SettingsModule - 系统设置模块
 *
 * 提供系统配置管理功能
 */
@Module({
  imports: [ConfigModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
