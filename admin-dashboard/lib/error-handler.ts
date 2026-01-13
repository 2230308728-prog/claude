import { AxiosError } from 'axios';

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status || 500;
    const data = error.response?.data as any;

    // 根据状态码返回友好错误信息
    const errorMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请先登录',
      403: '没有权限访问',
      404: '请求的资源不存在',
      409: '数据冲突，请刷新后重试',
      422: '数据验证失败',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
      504: '请求超时',
    };

    const message = data?.message || errorMessages[status] || '请求失败，请稍后重试';
    const code = data?.error;

    return new ApiError(message, status, code, data);
  }

  // 网络错误
  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return new ApiError('网络连接失败，请检查网络设置', 0, 'NETWORK_ERROR');
    }
    if (error.message.includes('timeout')) {
      return new ApiError('请求超时，请稍后重试', 0, 'TIMEOUT');
    }
    return new ApiError(error.message, 0, 'UNKNOWN_ERROR');
  }

  return new ApiError('未知错误', 0, 'UNKNOWN_ERROR');
}

/**
 * 显示错误提示
 */
export function showError(error: unknown): string {
  const apiError = handleApiError(error);

  // 可以集成 toast 通知
  if (typeof window !== 'undefined') {
    console.error('[API Error]', apiError.message);
  }

  return apiError.message;
}

/**
 * 判断错误是否为特定类型
 */
export function isApiError(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'NETWORK_ERROR';
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  return false;
}
