import api, { ApiResponse, PaginatedResponse } from './api';
import type {
  Product,
  ProductCategory,
  CreateProductDto,
  UpdateProductDto,
  ProductQuery,
} from '@/types';

export const productService = {
  /**
   * 获取产品列表
   */
  async getProducts(query?: ProductQuery): Promise<PaginatedResponse<Product>> {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params: query });
    // 转换响应格式
    return {
      data: response.data.data,
      meta: response.data.meta as any,
    };
  },

  /**
   * 获取产品详情
   */
  async getProduct(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  /**
   * 创建产品
   */
  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  /**
   * 更新产品
   */
  async updateProduct(id: number, data: UpdateProductDto): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除产品
   */
  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  /**
   * 发布产品
   */
  async publishProduct(id: number): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/publish`);
    return response.data.data;
  },

  /**
   * 下架产品
   */
  async unpublishProduct(id: number): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/unpublish`);
    return response.data.data;
  },

  /**
   * 获取产品分类列表
   */
  async getCategories(): Promise<ProductCategory[]> {
    const response = await api.get<ApiResponse<ProductCategory[]>>('/products/categories');
    return response.data.data;
  },

  /**
   * 创建产品分类
   */
  async createCategory(data: { name: string; description?: string; sortOrder?: number }): Promise<ProductCategory> {
    const response = await api.post<ApiResponse<ProductCategory>>('/products/categories', data);
    return response.data.data;
  },

  /**
   * 更新产品分类
   */
  async updateCategory(id: number, data: { name?: string; description?: string; sortOrder?: number }): Promise<ProductCategory> {
    const response = await api.put<ApiResponse<ProductCategory>>(`/products/categories/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除产品分类
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/products/categories/${id}`);
  },

  /**
   * 上传产品图片
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ url: string }>>('/products/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
