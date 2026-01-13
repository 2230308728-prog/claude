export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  appName: 'bmad 管理后台',
};

export const apiUrl = {
  // Auth
  login: '/auth/admin/login',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh',

  // Products
  products: '/products',
  productCategories: '/products/categories',

  // Orders
  orders: '/orders',
  refunds: '/refunds',

  // Users
  users: '/users',
  dashboard: {
    stats: '/users/dashboard/stats',
    orderStats: '/users/dashboard/order-stats',
  },

  // Issues
  issues: '/issues',
} as const;

// Build full API URL
export const buildUrl = (path: string): string => {
  return `${config.apiBaseUrl}${path}`;
};
