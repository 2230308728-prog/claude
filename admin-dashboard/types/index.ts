// User & Auth types
export interface User {
  id: number;
  email: string;
  nickname?: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'PARENT';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Product types
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  categoryId: number;
  price: number;
  originalPrice?: number;
  stock: number;
  minAge?: number;
  maxAge?: number;
  duration?: number;
  location?: string;
  images: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  featured: boolean;
  viewCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
}

export interface CreateProductDto {
  title: string;
  description?: string;
  categoryId: number;
  price: number;
  originalPrice?: number;
  stock: number;
  minAge?: number;
  maxAge?: number;
  duration?: number;
  location?: string;
  images?: string[];
  featured?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;
  status?: string;
  featured?: boolean;
  minAge?: number;
  maxAge?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Order types
export type OrderStatus = 'PENDING' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  user?: User;
  productId: number;
  product?: Product;
  contactName: string;
  contactPhone: string;
  participantName: string;
  participantAge: number;
  travelDate?: string;
  remarks?: string;
  totalAmount: number;
  status: OrderStatus;
  paidAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  userId?: number;
  productId?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface OrderStat {
  date: string;
  orders: number;
  revenue: number;
}

// Issue types
export interface Issue {
  id: number;
  orderNo: string;
  userId: number;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

// Refund types
export interface Refund {
  id: number;
  refundNo: string;
  orderId: number;
  order?: Order;
  userId: number;
  user?: User;
  amount: number;
  reason: string;
  description?: string;
  status: RefundStatus;
  note?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundDto {
  orderId: number;
  reason: string;
  description?: string;
}

export interface ProcessRefundDto {
  status: 'APPROVED' | 'REJECTED' | 'COMPLETED';
  note?: string;
}

export interface RefundQuery {
  page?: number;
  pageSize?: number;
  status?: RefundStatus;
  userId?: number;
  orderId?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

// Coupon types
export type CouponType = 'PERCENT' | 'AMOUNT';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';
export type UserCouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED';

export interface Coupon {
  id: number;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  totalQuantity: number;
  claimedQuantity: number;
  limitPerUser: number;
  validFrom: string;
  validUntil: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponDto {
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  totalQuantity: number;
  limitPerUser?: number;
  validFrom: string;
  validUntil: string;
  productIds?: number[];
  categoryIds?: number[];
  isEnabled?: boolean;
}

export interface UpdateCouponDto {
  name?: string;
  description?: string;
  value?: number;
  minAmount?: number;
  maxDiscount?: number;
  isEnabled?: boolean;
}

export interface CouponQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: CouponStatus;
}

export interface CouponStats {
  couponId: number;
  totalClaims: number;
  usedCount: number;
  availableCount: number;
  expiredCount: number;
  totalDiscount: number;
  avgOrderValue: number;
  claimsByDate: { date: string; count: number }[];
  usageByDate: { date: string; count: number }[];
}

export interface UserCoupon {
  id: number;
  userId: number;
  couponId: number;
  coupon?: Coupon;
  status: UserCouponStatus;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

// Review types
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: number;
  orderId: number;
  userId: number;
  productId: number;
  rating: number;
  content?: string;
  images: string[];
  isAnonymous: boolean;
  status: ReviewStatus;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    nickname?: string;
    avatarUrl?: string;
  };
  product?: {
    id: number;
    title: string;
    images: string[];
  };
  order?: {
    id: number;
    orderNo: string;
  };
}

export interface CreateReviewDto {
  orderId: number;
  productId: number;
  rating: number;
  content?: string;
  images?: string[];
  isAnonymous?: boolean;
}

export interface UpdateReviewDto {
  content?: string;
  images?: string[];
}

export interface ReviewQuery {
  page?: number;
  pageSize?: number;
  productId?: number;
  userId?: number;
  rating?: number;
  status?: ReviewStatus;
  keyword?: string;
}

export interface ReviewStats {
  totalCount: number;
  averageRating: number;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

