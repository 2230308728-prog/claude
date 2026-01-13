import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OSS = require('ali-oss');
import { randomUUID } from 'crypto';

/**
 * OSS 配置接口
 */
interface OssConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}

/**
 * OssService - 阿里云 OSS 对象存储服务
 *
 * 提供文件上传、删除、签名URL生成等功能
 */
@Injectable()
export class OssService implements OnModuleInit {
  private readonly logger = new Logger(OssService.name);
  private client!: OSS;
  private config!: OssConfig;
  private isEnabled = false;

  constructor() {
    this.config = {
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || 'bmad-storage',
    };

    // 只有在配置了有效的访问密钥时才初始化 OSS 客户端
    if (this.config.accessKeyId && this.config.accessKeySecret) {
      this.client = new OSS(this.config);
      this.isEnabled = true;
    } else {
      this.logger.warn('OSS credentials not configured. File upload features will be disabled.');
    }
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      this.logger.warn('OSS service is disabled due to missing credentials.');
      return;
    }

    try {
      // 验证 OSS 配置是否正确
      await this.client.list({ 'max-keys': 1 }, {});
      this.logger.log('OSS connected successfully');
    } catch (error) {
      this.logger.warn('OSS connection test failed (this is expected if credentials are not configured)');
    }
  }

  /**
   * 上传文件到 OSS
   */
  async uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<string> {
    if (!this.isEnabled) {
      throw new Error('OSS service is not configured. Please set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET environment variables.');
    }

    try {
      const date = new Date();
      const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      const ext = fileName.split('.').pop();
      const uniqueFileName = `${randomUUID()}.${ext}`;

      const key = folder
        ? `${folder}/${datePrefix}/${uniqueFileName}`
        : `${datePrefix}/${uniqueFileName}`;

      const mimeType = this.getMimeType(ext || '');

      const result = await this.client.put(key, buffer, {
        headers: mimeType ? { 'Content-Type': mimeType } : undefined,
      });

      this.logger.log(`File uploaded: ${key}`);
      return result.url;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * 生成 OSS 直传签名 URL
   */
  async generateSignedUploadUrl(fileName: string, folder?: string): Promise<{
    url: string;
    signature: string;
    host: string;
    key: string;
    policy: string;
  }> {
    try {
      const date = new Date();
      const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      const ext = fileName.split('.').pop();
      const uniqueFileName = `${randomUUID()}.${ext || 'bin'}`;

      const key = folder
        ? `${folder}/${datePrefix}/${uniqueFileName}`
        : `${datePrefix}/${uniqueFileName}`;

      // 生成过期时间为 15 分钟
      const expiration = new Date(Date.now() + 15 * 60 * 1000);

      const policy: Record<string, any> = {
        expiration: expiration.toISOString(),
        conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024],
        ],
      };

      const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');
      // 使用简单的 HMAC-SHA1 签名
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha1', this.config.accessKeySecret)
        .update(policyBase64)
        .digest('base64');

      const host = `${this.config.bucket}.${this.config.region}.aliyuncs.com`;
      const url = `https://${host}`;

      this.logger.log(`Generated signed upload URL for: ${key}`);

      return {
        url,
        signature,
        host,
        key,
        policy: policyBase64,
      };
    } catch (error) {
      this.logger.error(`Failed to generate signed upload URL for: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * 删除 OSS 文件
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.slice(1);

      await this.client.delete(key);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileUrl}`, error);
      throw error;
    }
  }

  /**
   * 批量删除 OSS 文件
   */
  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    try {
      const keys = fileUrls.map((url) => {
        const urlObj = new URL(url);
        return urlObj.pathname.slice(1);
      });

      await this.client.deleteMulti(keys);
      this.logger.log(`Deleted ${keys.length} files`);
    } catch (error) {
      this.logger.error('Failed to delete multiple files', error);
      throw error;
    }
  }

  /**
   * 获取文件的签名 URL（用于私有文件）
   */
  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      const url = this.client.signatureUrl(key, {
        expires: expiresInSeconds,
      });
      return url;
    } catch (error) {
      this.logger.error(`Failed to get signed URL for: ${key}`, error);
      throw error;
    }
  }

  /**
   * 列出指定前缀的文件
   */
  async listFiles(prefix: string, maxKeys: number = 100): Promise<{
    name: string;
    url: string;
    size: number;
    lastModified: Date;
  }[]> {
    try {
      const result = await this.client.list({
        prefix,
        'max-keys': maxKeys,
      }, {});

      const host = `${this.config.bucket}.${this.config.region}.aliyuncs.com`;

      return (result.objects || []).map((obj) => ({
        name: obj.name,
        url: `https://${host}/${obj.name}`,
        size: obj.size,
        lastModified: new Date(obj.lastModified),
      }));
    } catch (error) {
      this.logger.error(`Failed to list files with prefix: ${prefix}`, error);
      throw error;
    }
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      json: 'application/json',
      txt: 'text/plain',
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 验证文件类型（仅允许图片）
   */
  validateImageFile(fileName: string): boolean {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(ext || '');
  }

  /**
   * 获取 CDN 域名（如果配置了）
   */
  getCdnUrl(fileKey: string): string {
    const cdnDomain = process.env.OSS_CDN_DOMAIN;
    if (cdnDomain) {
      return `${cdnDomain}/${fileKey}`;
    }
    return `https://${this.config.bucket}.${this.config.region}.aliyuncs.com/${fileKey}`;
  }
}
